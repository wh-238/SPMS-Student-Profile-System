const { OpenAI } = require('openai');
const pool = require('../config/db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 存储用户的对话历史（实际应用应该用数据库）
const conversations = {};

const normalizeMajor = (major) => String(major || '').trim();
const SUPPORTED_PUBLIC_FIELDS = ['major', 'bio', 'phone', 'address', 'birthday', 'role', 'name'];

const detectLanguage = (text) => (/[^\u0000-\u007f]/.test(String(text || '')) ? 'zh' : 'en');

const getPublicMajorEntries = (users) => users
  .map(user => ({
    ...user,
    major: normalizeMajor(user.major)
  }))
  .filter(user => user.major);

const buildMajorCounts = (users) => getPublicMajorEntries(users)
  .reduce((counts, user) => {
    counts[user.major] = (counts[user.major] || 0) + 1;
    return counts;
  }, {});

const sortMajorCounts = (majorCounts) => Object.entries(majorCounts)
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

const isCountQuestion = (message) => {
  const text = String(message || '').toLowerCase();

  return /how many|number of|count of|多少人|几个人|几人|多少位/.test(text);
};

const isMajorListQuestion = (message) => {
  const text = String(message || '').toLowerCase();

  return (
    /what kind of majors|what majors|which majors|list.*majors|major.*in this system|majors.*in this system|majors do .*have|available majors/.test(text) ||
    /有哪些.*专业|什么专业|哪些专业|列出.*专业|系统里.*专业|专业.*有哪些/.test(String(message || ''))
  );
};

const isMajorRankingQuestion = (message) => {
  const text = String(message || '').toLowerCase();

  return (
    /(major).*(most|highest|largest|top)|most students.*major|which major has the most|popular major|major distribution|count by major/.test(text) ||
    /哪个专业.*最多|什么专业.*最多|专业分布|专业统计|按专业.*人数|最多.*专业/.test(String(message || ''))
  );
};

const buildMajorSummaryReply = (message, users) => {
  const language = detectLanguage(message);
  const majorCounts = buildMajorCounts(users);
  const sortedMajors = sortMajorCounts(majorCounts);

  if (sortedMajors.length === 0) {
    return language === 'zh'
      ? '根据当前公开资料，暂时没有用户公开他们的专业信息，所以我还不能总结系统里有哪些专业。'
      : 'Based on the current public profiles, no users have made their major public yet, so I cannot summarize the majors in the system.';
  }

  const formattedMajors = sortedMajors
    .map(([major, count]) => language === 'zh' ? `${major}（${count}人）` : `${major} (${count})`)
    .join(language === 'zh' ? '、' : ', ');

  if (isMajorRankingQuestion(message)) {
    const highestCount = sortedMajors[0][1];
    const topMajors = sortedMajors
      .filter(([, count]) => count === highestCount)
      .map(([major]) => major);

    if (language === 'zh') {
      return topMajors.length === 1
        ? `根据当前公开资料，人数最多的专业是 ${topMajors[0]}，共有 ${highestCount} 人公开了这个专业。当前可见的专业分布为：${formattedMajors}。`
        : `根据当前公开资料，目前人数最多的专业并列为 ${topMajors.join('、')}，各有 ${highestCount} 人公开。当前可见的专业分布为：${formattedMajors}。`;
    }

    return topMajors.length === 1
      ? `Based on the current public profiles, the major with the most students is ${topMajors[0]}, with ${highestCount} public profile${highestCount === 1 ? '' : 's'}. The visible major distribution is: ${formattedMajors}.`
      : `Based on the current public profiles, the top majors are tied between ${topMajors.join(', ')}, with ${highestCount} public profiles each. The visible major distribution is: ${formattedMajors}.`;
  }

  return language === 'zh'
    ? `根据当前公开资料，系统里目前可见的专业有：${formattedMajors}。`
    : `Based on the current public profiles, the visible majors in the system are: ${formattedMajors}.`;
};

const normalizeFieldValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const getQueryableUsers = (users, currentUser) => users.map(user => {
  if (user.id !== currentUser.id) {
    return user;
  }

  return {
    ...user,
    major: currentUser.major || user.major,
    bio: currentUser.bio || user.bio,
    phone: currentUser.phone || user.phone,
    address: currentUser.address || user.address,
    birthday: currentUser.birthday || user.birthday
  };
});

const findMentionedMajor = (message, users) => {
  const text = String(message || '').toLowerCase();
  const majors = [...new Set(users
    .map(user => normalizeMajor(user.major))
    .filter(Boolean))]
    .sort((left, right) => right.length - left.length);

  return majors.find(major => text.includes(major.toLowerCase())) || null;
};

const buildMajorCountReply = (message, users) => {
  if (!isCountQuestion(message)) {
    return null;
  }

  const major = findMentionedMajor(message, users);
  if (!major) {
    return null;
  }

  const language = detectLanguage(message);
  const count = users.filter(user => normalizeMajor(user.major).toLowerCase() === major.toLowerCase()).length;

  return language === 'zh'
    ? `根据当前公开资料，${major} 专业共有 ${count} 人。`
    : `Based on the current public profiles, there ${count === 1 ? 'is' : 'are'} ${count} student${count === 1 ? '' : 's'} in ${major}.`;
};

const applyEqualityFilters = (users, filters) => {
  if (!Array.isArray(filters) || filters.length === 0) {
    return users;
  }

  return users.filter(user => filters.every(filter => {
    const field = String(filter?.field || '').toLowerCase();
    const value = normalizeFieldValue(filter?.value).toLowerCase();

    if (!SUPPORTED_PUBLIC_FIELDS.includes(field) || !value) {
      return true;
    }

    return normalizeFieldValue(user[field]).toLowerCase() === value;
  }));
};

const summarizeDistinctValues = (message, field, visibleUsers) => {
  const language = detectLanguage(message);
  const values = [...new Set(visibleUsers
    .map(user => normalizeFieldValue(user[field]))
    .filter(Boolean))].sort((left, right) => left.localeCompare(right));

  if (values.length === 0) {
    return language === 'zh'
      ? `根据当前公开资料，暂无可见的${field}信息。`
      : `Based on current public profiles, there is no visible ${field} information yet.`;
  }

  return language === 'zh'
    ? `根据当前公开资料，可见的${field}有：${values.join('、')}。`
    : `Based on current public profiles, visible ${field} values are: ${values.join(', ')}.`;
};

const summarizeCountByValue = (message, field, visibleUsers) => {
  const language = detectLanguage(message);
  const counts = visibleUsers.reduce((accumulator, user) => {
    const value = normalizeFieldValue(user[field]);
    if (!value) return accumulator;
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

  const sorted = Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  if (sorted.length === 0) {
    return language === 'zh'
      ? `根据当前公开资料，暂无可统计的${field}信息。`
      : `Based on current public profiles, there is no visible ${field} data to count.`;
  }

  const detail = sorted
    .map(([value, count]) => language === 'zh' ? `${value}（${count}人）` : `${value} (${count})`)
    .join(language === 'zh' ? '、' : ', ');

  return language === 'zh'
    ? `根据当前公开资料，${field}分布为：${detail}。`
    : `Based on current public profiles, ${field} distribution is: ${detail}.`;
};

const summarizeTopValue = (message, field, visibleUsers) => {
  const language = detectLanguage(message);
  const counts = visibleUsers.reduce((accumulator, user) => {
    const value = normalizeFieldValue(user[field]);
    if (!value) return accumulator;
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

  const sorted = Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  if (sorted.length === 0) {
    return language === 'zh'
      ? `根据当前公开资料，暂无可用于比较“最多/最高”的${field}信息。`
      : `Based on current public profiles, there is no visible ${field} data for top-value comparison.`;
  }

  const topCount = sorted[0][1];
  const topValues = sorted.filter(([, count]) => count === topCount).map(([value]) => value);

  if (language === 'zh') {
    return topValues.length === 1
      ? `根据当前公开资料，${field}里最多的是 ${topValues[0]}，共有 ${topCount} 人。`
      : `根据当前公开资料，${field}里并列最多的是 ${topValues.join('、')}，各有 ${topCount} 人。`;
  }

  return topValues.length === 1
    ? `Based on current public profiles, the most common ${field} is ${topValues[0]} with ${topCount} users.`
    : `Based on current public profiles, the top ${field} values are tied between ${topValues.join(', ')} with ${topCount} users each.`;
};

const summarizeUsersWithValue = (message, field, value, visibleUsers) => {
  const language = detectLanguage(message);
  const normalizedValue = normalizeFieldValue(value).toLowerCase();

  if (!normalizedValue) {
    return language === 'zh'
      ? `请先告诉我你要筛选的${field}值。`
      : `Please specify the ${field} value you want to filter by.`;
  }

  const matchedUsers = visibleUsers.filter(user => normalizeFieldValue(user[field]).toLowerCase() === normalizedValue);

  if (matchedUsers.length === 0) {
    return language === 'zh'
      ? `根据当前公开资料，没有用户公开显示 ${field} = ${value}。`
      : `Based on current public profiles, no user publicly shows ${field} = ${value}.`;
  }

  const names = matchedUsers.map(user => user.name).join(language === 'zh' ? '、' : ', ');
  return language === 'zh'
    ? `根据当前公开资料，${field}为 ${value} 的用户有：${names}。`
    : `Based on current public profiles, users with ${field} = ${value} are: ${names}.`;
};

const executePublicDataPlan = (message, plan, users) => {
  const operation = String(plan?.operation || '').toLowerCase();
  const field = String(plan?.field || '').toLowerCase();
  const filters = Array.isArray(plan?.filters) ? plan.filters : [];
  const value = plan?.value;

  if (!SUPPORTED_PUBLIC_FIELDS.includes(field)) {
    return null;
  }

  const visibleUsers = applyEqualityFilters(users, filters);

  if (operation === 'list_values') {
    return summarizeDistinctValues(message, field, visibleUsers);
  }

  if (operation === 'count_by_value') {
    return summarizeCountByValue(message, field, visibleUsers);
  }

  if (operation === 'top_value') {
    return summarizeTopValue(message, field, visibleUsers);
  }

  if (operation === 'list_users_with_value') {
    return summarizeUsersWithValue(message, field, value, visibleUsers);
  }

  return null;
};

const planPublicDataQuery = async (message) => {
  const plannerPrompt = `You are a query planner for SPMS public profile data.
Decide whether the user's message should be answered by querying structured public data instead of free-form chat.

Supported operations:
- list_values: list distinct values of a field
- count_by_value: count users grouped by field value
- top_value: find the field value with the highest count
- list_users_with_value: list user names where field equals value

Supported fields:
- major, bio, phone, address, birthday, role, name

Rules:
- Only return shouldUseData=true when the user clearly asks for lookup/statistics/listing over public profile fields.
- Never invent unsupported field or operation.
- filters must be equality filters only, array of { field, value }.
- Return strict JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: plannerPrompt },
        { role: 'user', content: String(message || '') }
      ]
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.shouldUseData) return null;

    return {
      operation: parsed.operation,
      field: parsed.field,
      value: parsed.value,
      filters: parsed.filters
    };
  } catch (error) {
    return null;
  }
};

const buildPublicUserDirectory = (users, currentUserId) => {
  const visibleUsers = users.filter(user => user.id !== currentUserId);

  if (visibleUsers.length === 0) {
    return '（当前没有其他可用的公开用户资料）';
  }

  return visibleUsers
    .map(user => {
      const fields = [`${user.name} (ID: ${user.id})`];
      if (user.email) fields.push(`邮箱: ${user.email}`);
      if (user.role) fields.push(`角色: ${user.role}`);
      if (user.major) fields.push(`专业: ${user.major}`);
      if (user.bio) fields.push(`简介: ${user.bio}`);
      if (user.phone) fields.push(`电话: ${user.phone}`);
      if (user.address) fields.push(`地址: ${user.address}`);
      if (user.birthday) fields.push(`生日: ${user.birthday}`);
      return '- ' + fields.join(', ');
    })
    .join('\n');
};

const buildPublicMajorStats = (users) => {
  const sortedMajors = sortMajorCounts(buildMajorCounts(users));

  if (sortedMajors.length === 0) {
    return '（当前没有可用于统计的公开专业信息）';
  }

  return sortedMajors
    .map(([major, count]) => `- ${major}: ${count} 人`)
    .join('\n');
};

// 获取用户的 profile 信息
const getUserProfile = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        users.id, users.name, users.email, users.role,
        profiles.major, profiles.bio, profiles.phone, profiles.address, profiles.birthday
       FROM users
       LEFT JOIN profiles ON users.id = profiles.user_id
       WHERE users.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};


// 获取所有用户列表（遗留函数，不再使用）

// 获取所有用户列表（遵守隐私设置）
const getAllUsersWithPrivacy = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        users.id,
        users.name,
        users.email,
        users.role,
        profiles.major,
        profiles.bio,
        profiles.phone,
        profiles.address,
        profiles.birthday,
        privacy_settings.show_major,
        privacy_settings.show_bio,
        privacy_settings.show_phone,
        privacy_settings.show_address,
        privacy_settings.show_birthday
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      LEFT JOIN privacy_settings ON users.id = privacy_settings.user_id
      LIMIT 50`
    );

    // 只返回每个用户愿意公开的信息
    return result.rows.map(user => {
      const publicUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      if (user.show_major && user.major) publicUser.major = user.major;
      if (user.show_bio && user.bio) publicUser.bio = user.bio;
      if (user.show_phone && user.phone) publicUser.phone = user.phone;
      if (user.show_address && user.address) publicUser.address = user.address;
      if (user.show_birthday && user.birthday) publicUser.birthday = user.birthday;

      return publicUser;
    });
  } catch (error) {
    console.error('Error fetching users with privacy:', error);
    return [];
  }
};

// 根据用户 ID 获取用户信息（遵守隐私设置）
const getUserByIdWithPrivacy = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        users.id,
        users.name,
        users.email,
        users.role,
        profiles.major,
        profiles.bio,
        profiles.phone,
        profiles.address,
        profiles.birthday,
        privacy_settings.show_major,
        privacy_settings.show_bio,
        privacy_settings.show_phone,
        privacy_settings.show_address,
        privacy_settings.show_birthday
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      LEFT JOIN privacy_settings ON users.id = privacy_settings.user_id
      WHERE users.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.show_major && user.major) publicUser.major = user.major;
    if (user.show_bio && user.bio) publicUser.bio = user.bio;
    if (user.show_phone && user.phone) publicUser.phone = user.phone;
    if (user.show_address && user.address) publicUser.address = user.address;
    if (user.show_birthday && user.birthday) publicUser.birthday = user.birthday;

    return publicUser;
  } catch (error) {
    console.error('Error fetching user by id with privacy:', error);
    return null;
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const authenticatedUserId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // 获取当前用户信息
    const currentUser = await getUserProfile(authenticatedUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 初始化用户对话
    if (!conversations[authenticatedUserId]) {
      conversations[authenticatedUserId] = [];
    }

    // 添加用户消息
    conversations[authenticatedUserId].push({
      role: 'user',
      content: message
    });

    const allUsers = await getAllUsersWithPrivacy();
    const queryableUsers = getQueryableUsers(allUsers, currentUser);
    const publicUserDirectory = buildPublicUserDirectory(allUsers, currentUser.id);
    const publicMajorStats = buildPublicMajorStats(queryableUsers);

    const exactMajorCountReply = buildMajorCountReply(message, queryableUsers);
    if (exactMajorCountReply) {
      conversations[authenticatedUserId].push({
        role: 'assistant',
        content: exactMajorCountReply
      });

      if (conversations[authenticatedUserId].length > 20) {
        conversations[authenticatedUserId] = conversations[authenticatedUserId].slice(-20);
      }

      return res.json({
        message: exactMajorCountReply,
        conversationHistory: conversations[authenticatedUserId]
      });
    }

    const dataPlan = await planPublicDataQuery(message);
    const dynamicDataReply = dataPlan
      ? executePublicDataPlan(message, dataPlan, queryableUsers)
      : null;

    if (dynamicDataReply) {
      conversations[authenticatedUserId].push({
        role: 'assistant',
        content: dynamicDataReply
      });

      if (conversations[authenticatedUserId].length > 20) {
        conversations[authenticatedUserId] = conversations[authenticatedUserId].slice(-20);
      }

      return res.json({
        message: dynamicDataReply,
        conversationHistory: conversations[authenticatedUserId]
      });
    }

    if (isMajorListQuestion(message) || isMajorRankingQuestion(message)) {
      const directReply = buildMajorSummaryReply(message, queryableUsers);

      conversations[authenticatedUserId].push({
        role: 'assistant',
        content: directReply
      });

      if (conversations[authenticatedUserId].length > 20) {
        conversations[authenticatedUserId] = conversations[authenticatedUserId].slice(-20);
      }

      return res.json({
        message: directReply,
        conversationHistory: conversations[authenticatedUserId]
      });
    }

    // 构建系统提示词
    let systemPrompt = `你是 SPMS（学生信息管理系统）的智能助手。你的职责是帮助用户查询和管理他们的个人信息、浏览其他用户信息，以及回答关于系统的问题。

【重要隐私政策】
你必须严格遵守用户的隐私设置。如果用户没有允许公开某项信息，你就不能透露。例如：
- 如果用户未设置 show_major=true，你不能告诉别人他的专业
- 如果用户未设置 show_phone=true，你不能告诉别人他的电话
- 如果用户询问某个用户的私密信息但该用户未公开，要说"该用户未公开此信息"

【回答规则】
- 你可以完整回答当前登录用户自己的信息。
- 你可以基于“系统中的其他用户（仅公开信息）”回答其他用户资料问题。
- 你可以基于公开信息做统计、汇总、排序、比较和概括，例如“哪个专业人数最多”、“公开资料里有多少人来自某专业”、“列出公开了专业的用户”。
- 做统计时，必须明确是“根据当前公开资料”得出的结果，不能假装代表全部用户。
- 如果答案已经能从提供的公开资料中得出，不要再说“我无法访问聚合数据”或“我没有统计权限”。
- 如果某项信息没有出现在公开资料里，才说明“该用户未公开此信息”或“根据当前公开资料无法判断”。

当前用户信息（完整访问权限）：
- ID: ${currentUser.id}
- 名字: ${currentUser.name}
- 邮箱: ${currentUser.email}
- 角色: ${currentUser.role}
- 专业: ${currentUser.major || '未设置'}
- 个人简介: ${currentUser.bio || '未设置'}
- 电话: ${currentUser.phone || '未设置'}
- 地址: ${currentUser.address || '未设置'}
- 生日: ${currentUser.birthday || '未设置'}

系统中的其他用户（仅公开信息）：
${publicUserDirectory}

公开专业统计（仅基于已公开 major 的用户）：
${publicMajorStats}`;

    systemPrompt += `

你能做的事：
1. 回答关于当前用户的任何信息问题
2. 提供系统中其他用户的信息（仅限用户本人公开的部分）
3. 解释系统功能和使用指南
4. 提供关于隐私设置、编辑个人信息等的帮助
5. 如果某项信息未被公开，要明确告诉用户"该用户未公开此信息"
6. 对于人数最多、分布、排行、筛选等问题，优先使用上面的公开资料和公开统计直接回答

IMPORTANT: Detect the language of the user's latest message and always reply in that exact same language. If the user writes in English, respond entirely in English. If the user writes in Chinese, respond entirely in Chinese. Never switch languages mid-conversation unless the user does first. Always be friendly, professional, and helpful.`;

    // 准备发送给 OpenAI 的消息
    const messagesForAPI = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversations[authenticatedUserId]
    ];

    // 调用 OpenAI API（使用 gpt-4-turbo）
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesForAPI,
      max_tokens: 500
    });

    const assistantMessage = response.choices[0].message.content;

    // 添加助手回复到历史
    conversations[authenticatedUserId].push({
      role: 'assistant',
      content: assistantMessage
    });

    // 只保留最近 20 条消息避免上下文过长
    if (conversations[authenticatedUserId].length > 20) {
      conversations[authenticatedUserId] = conversations[authenticatedUserId].slice(-20);
    }

    res.json({
      message: assistantMessage,
      conversationHistory: conversations[authenticatedUserId]
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      message: error.message || 'Failed to get response from AI'
    });
  }
};

exports.getHistory = (req, res) => {
  try {
    const userId = req.user.id;

    const history = conversations[userId] || [];
    res.json({ conversationHistory: history });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to get conversation history' });
  }
};

exports.clearHistory = (req, res) => {
  try {
    const userId = req.user.id;

    delete conversations[userId];
    res.json({ message: 'Conversation cleared' });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ message: 'Failed to clear conversation' });
  }
};
