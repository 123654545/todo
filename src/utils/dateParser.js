import dayjs from 'dayjs'

// 日期关键词映射
const dateKeywords = {
  // 相对日期
  '今天': 0,
  '明天': 1,
  '后天': 2,
  '大后天': 3,
  '昨天': -1,
  '前天': -2,
  '大前天': -3,
  
  // 星期
  '周日': 0, '星期天': 0,
  '周一': 1, '星期一': 1,
  '周二': 2, '星期二': 2,
  '周三': 3, '星期三': 3,
  '周四': 4, '星期四': 4,
  '周五': 5, '星期五': 5,
  '周六': 6, '星期六': 6,
  
  // 时间段
  '早上': 'morning',
  '上午': 'morning',
  '中午': 'noon',
  '下午': 'afternoon',
  '晚上': 'evening',
  '凌晨': 'earlyMorning'
}

// 时间格式正则
const timePatterns = [
  // 24小时制
  /(\d{1,2}):(\d{2})/,
  /(\d{1,2})点(\d{1,2})分?/,
  /(\d{1,2})点/,
  
  // 12小时制
  /上午\s*(\d{1,2})点?/,
  /下午\s*(\d{1,2})点?/,
  /晚上\s*(\d{1,2})点?/,
  
  // 数字时间
  /(\d{1,2})[点时]半/,
  /(\d{1,2})刻/
]

// 日期格式正则
const datePatterns = [
  // YYYY-MM-DD
  /(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})[日号]?/,
  
  // MM-DD
  /(\d{1,2})[-/月](\d{1,2})[日号]?/,
  
  // 数字+号格式（如：25号）
  /(\d{1,2})[日号]/,
  
  // 相对日期
  /(今天|明天|后天|大后天|昨天|前天|大前天)/,
  
  // 星期
  /(周日|星期天|周一|星期一|周二|星期二|周三|星期三|周四|星期四|周五|星期五|周六|星期六)/
]

/**
 * 从文本中解析日期和时间
 * @param {string} text - 用户输入的文本
 * @returns {Object} 解析结果 { date: Date, time: string, hasDate: boolean, hasTime: boolean }
 */
export function parseDateTime(text) {
  let date = null
  let time = null
  let hasDate = false
  let hasTime = false
  let cleanedText = text
  
  // 1. 解析日期
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      hasDate = true
      cleanedText = cleanedText.replace(pattern, '').trim()
      
      if (match[1] in dateKeywords) {
        // 相对日期或星期
        const keyword = match[1]
        const offset = dateKeywords[keyword]
        
        if (keyword.includes('周') || keyword.includes('星期')) {
          // 星期处理（中国习惯：周一为一周第一天）
          const today = dayjs()
          const currentDay = today.day()
          // 调整星期映射：周日(0) -> 6, 周一(1) -> 0, 周二(2) -> 1, ..., 周六(6) -> 5
          const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1
          let targetDay = offset
          // 调整目标星期：周日(0) -> 6, 周一(1) -> 0, 周二(2) -> 1, ..., 周六(6) -> 5
          const adjustedTargetDay = targetDay === 0 ? 6 : targetDay - 1
          
          // 计算距离目标星期还有几天
          let daysToAdd = adjustedTargetDay - adjustedCurrentDay
          if (daysToAdd < 0) daysToAdd += 7
          
          date = today.add(daysToAdd, 'day').format('YYYY-MM-DD')
        } else {
          // 相对日期处理
          date = dayjs().add(offset, 'day').format('YYYY-MM-DD')
        }
      } else if (match[3]) {
        // YYYY-MM-DD 格式
        date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else if (match[2]) {
        // MM-DD 格式（假设为当前年）
        const year = dayjs().year()
        date = `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
      } else {
        // 数字+号格式（如：25号）- 默认使用当前月份
        const day = parseInt(match[1])
        const today = dayjs()
        
        // 始终使用当前月份，如果日期已过则设为下个月
        if (day < today.date()) {
          date = today.add(1, 'month').date(day).format('YYYY-MM-DD')
        } else {
          date = today.date(day).format('YYYY-MM-DD')
        }
      }
      break
    }
  }
  
  // 2. 解析时间
  for (const pattern of timePatterns) {
    const match = text.match(pattern)
    if (match) {
      hasTime = true
      cleanedText = cleanedText.replace(pattern, '').trim()
      
      if (pattern.source.includes('点')) {
        // 中文时间格式
        let hours = parseInt(match[1])
        let minutes = match[2] ? parseInt(match[2]) : 0
        
        // 处理12小时制
        if (text.includes('下午') || text.includes('晚上')) {
          if (hours < 12) hours += 12
        } else if (text.includes('上午') || text.includes('早上')) {
          if (hours === 12) hours = 0
        }
        
        // 处理特殊时间表达
        if (pattern.source.includes('半')) {
          minutes = 30
        } else if (pattern.source.includes('刻')) {
          minutes = 15
        }
        
        time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      } else {
        // 24小时制
        const hours = match[1].padStart(2, '0')
        const minutes = (match[2] || '00').padStart(2, '0')
        time = `${hours}:${minutes}`
      }
      break
    }
  }
  
  // 3. 如果没有明确日期，默认设为今天
  if (!hasDate) {
    date = dayjs().format('YYYY-MM-DD')
    hasDate = true
  }
  
  // 4. 清理后的文本作为任务标题
  const title = cleanedText.trim() || text.trim()
  
  return {
    date,
    time,
    hasDate,
    hasTime,
    title
  }
}

/**
 * 根据解析结果确定任务优先级
 * @param {Object} parsed - 解析结果
 * @returns {string} 优先级 ('high' | 'medium' | 'low')
 */
export function determinePriority(parsed) {
  if (!parsed.hasDate) return 'medium'
  
  const today = dayjs()
  const taskDate = dayjs(parsed.date)
  const diffDays = taskDate.diff(today, 'day')
  
  if (diffDays <= 1) return 'high'
  if (diffDays <= 3) return 'medium'
  return 'low'
}



/**
 * 完整的自然语言任务解析（传统方法）
 * @param {string} text - 用户输入
 * @returns {Object} 解析后的任务数据
 */
export function parseTodoFromNL(text) {
  const parsed = parseDateTime(text)
  const priority = determinePriority(parsed)
  
  return {
    title: parsed.title,
    dueDate: parsed.date,
    dueTime: parsed.time,
    priority,
    category: 'general',
    description: '',
    nluRaw: text, // 保存原始输入用于调试
    parsedBy: 'Traditional'
  }
}

/**
 * 智能任务解析 - 主入口函数
 * @param {string} text - 用户输入
 * @returns {Promise<Object>} 解析后的任务数据
 */
export async function smartParseTodo(text) {
  return parseTodoFromNL(text)
}