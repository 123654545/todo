import { AITaskService } from './aiTaskService.js'
import dayjs from 'dayjs'
import { smartParseTodo } from '../utils/dateParser.js'

/**
 * AI任务处理器
 * 解析用户输入并执行相应的任务管理操作
 */
export class AITaskProcessor {
  
  /**
   * 处理用户请求
   * @param {string} userInput 用户输入
   * @returns {Promise<string>} AI回复内容
   */
  static async processRequest(userInput) {
    try {
      const input = userInput.toLowerCase().trim()
      
      // 1. 任务查询相关
      if (this.isQueryRequest(input)) {
        return await this.handleQueryRequest(input)
      }
      
      // 2. 任务编辑相关 - 提高优先级，放在添加之前
      if (this.isEditRequest(input)) {
        return await this.handleEditRequest(input)
      }
      
      // 3. 任务删除相关
      if (this.isDeleteRequest(input)) {
        return await this.handleDeleteRequest(input)
      }
      
      // 4. 任务状态切换
      if (this.isToggleRequest(input)) {
        return await this.handleToggleRequest(input)
      }
      
      // 5. 任务添加相关 - 降低优先级
      if (this.isAddRequest(input)) {
        return await this.handleAddRequest(input)
      }
      
      // 6. 统计信息
      if (this.isStatisticsRequest(input)) {
        return await this.handleStatisticsRequest()
      }
      
      // 7. 搜索任务
      if (this.isSearchRequest(input)) {
        return await this.handleSearchRequest(input)
      }
      
      // 如果没有匹配的操作，返回帮助信息
      return this.getHelpMessage()
      
    } catch (error) {
      console.error('AI任务处理失败:', error)
      return `抱歉，处理请求时出现错误：${error.message || '未知错误'}`
    }
  }

  /**
   * 判断是否为查询请求
   */
  static isQueryRequest(input) {
    const queryKeywords = ['显示', '查看', '列表', '有哪些', '什么任务', '任务列表', '待办', '已完成', '逾期', '今日']
    return queryKeywords.some(keyword => input.includes(keyword))
  }

  /**
   * 处理查询请求
   */
  static async handleQueryRequest(input) {
    if (input.includes('所有') || input.includes('全部') || input.includes('列表')) {
      const tasks = await AITaskService.getAllTasks()
      return AITaskService.formatTasksForAI(tasks)
    }
    
    if (input.includes('待办') || input.includes('未完成')) {
      const tasks = await AITaskService.getPendingTasks()
      return `待办任务列表：\n\n${AITaskService.formatTasksForAI(tasks)}`
    }
    
    if (input.includes('已完成') || input.includes('完成')) {
      const tasks = await AITaskService.getCompletedTasks()
      return `已完成任务列表：\n\n${AITaskService.formatTasksForAI(tasks)}`
    }
    
    if (input.includes('逾期') || input.includes('过期')) {
      const tasks = await AITaskService.getOverdueTasks()
      return `逾期任务列表：\n\n${AITaskService.formatTasksForAI(tasks)}`
    }
    
    if (input.includes('今日') || input.includes('今天')) {
      const tasks = await AITaskService.getTodayTasks()
      return `今日任务列表：\n\n${AITaskService.formatTasksForAI(tasks)}`
    }
    
    // 默认返回所有任务
    const tasks = await AITaskService.getAllTasks()
    return AITaskService.formatTasksForAI(tasks)
  }

  /**
   * 判断是否为添加请求
   */
  static isAddRequest(input) {
    // 首先检查是否包含编辑相关关键词，如果有则不认为是添加请求
    const editKeywords = ['修改', '编辑', '更新', '更改', '调整', '改', '改为', '改成', '重新安排', '重设']
    const hasEditKeyword = editKeywords.some(keyword => input.includes(keyword))
    
    if (hasEditKeyword) {
      return false
    }
    
    const addKeywords = [
      '添加', '创建', '新建', '增加', '添加任务', '创建任务', 
      '记一下', '记录', '提醒我', '提醒一下', '设置', '安排',
      '我要', '帮我', '需要', '想', '打算', '计划', '准备'
    ]
    
    // 检查是否包含明确的添加关键词
    const hasAddKeyword = addKeywords.some(keyword => input.includes(keyword))
    
    // 检查是否包含任务相关的名词
    const taskNouns = ['开会', '会议', '学习', '工作', '健身', '购物', '约会', '任务', '事情', '事项']
    const hasTaskNoun = taskNouns.some(noun => input.includes(noun))
    
    // 检查是否包含时间关键词
    const timeKeywords = ['明天', '后天', '下周', '今天', '今晚', '晚上', '早上', '下午', '几点', '何时']
    const hasTimeKeyword = timeKeywords.some(keyword => input.includes(keyword))
    
    // 判断条件：
    // 1. 明确包含添加关键词，或者
    // 2. 包含任务名词且有时间关键词，且不包含编辑关键词
    return hasAddKeyword || (hasTaskNoun && hasTimeKeyword && !hasEditKeyword)
  }

  /**
   * 处理添加请求
   */
  static async handleAddRequest(input) {
    // 解析任务信息
    const taskInfo = this.parseTaskInfo(input)
    
    // 如果解析失败，尝试更智能的解析
    if (!taskInfo.title) {
      const extractedTitle = this.extractTaskTitle(input)
      if (extractedTitle) {
        taskInfo.title = extractedTitle
      } else {
        return '请提供任务的标题。例如："添加任务：明天上午9点开会" 或 "明天要开会"'
      }
    }
    
    // 验证任务信息
    if (!taskInfo.title.trim()) {
      return '请提供有效的任务标题。例如："添加任务：明天上午9点开会"'
    }
    
    try {
      const newTask = await AITaskService.addTask(taskInfo)
      return `任务添加成功！\n\n${AITaskService.formatTaskForAI(newTask)}`
    } catch (error) {
      return `添加任务失败：${error.message}`
    }
  }

  /**
   * 判断是否为编辑请求
   */
  static isEditRequest(input) {
    const editKeywords = ['修改', '编辑', '更新', '更改', '调整', '改', '改为', '改成', '重新安排', '重设']
    
    // 特别处理时间修改相关的关键词
    const timeEditKeywords = ['时间', '日期', '时段', '几点', '何时', '什么时候', '改时间', '改日期']
    
    // 检查是否包含明确的编辑关键词
    const hasExplicitEdit = editKeywords.some(keyword => input.includes(keyword))
    
    // 检查是否包含时间修改相关的关键词，并且有具体的任务描述
    const hasTimeEdit = timeEditKeywords.some(keyword => input.includes(keyword))
    
    // 检查是否包含任务匹配的关键词（会议、任务等）
    const taskKeywords = ['会议', '任务', '事情', '事项', '安排', '约会']
    const hasTask = taskKeywords.some(keyword => input.includes(keyword))
    
    // 判断条件：
    // 1. 明确的编辑关键词，或者
    // 2. 时间修改关键词 + 任务关键词，或者
    // 3. 包含"改"字 + 任务关键词
    return hasExplicitEdit || 
           (hasTimeEdit && hasTask) ||
           (input.includes('改') && hasTask)
  }

  /**
   * 处理编辑请求
   */
  static async handleEditRequest(input) {
    // 先获取所有任务
    const allTasks = await AITaskService.getAllTasks()
    
    if (allTasks.length === 0) {
      return '当前没有任务可以编辑。'
    }
    
    // 查找要编辑的任务
    const taskToEdit = this.findTaskByTitle(input, allTasks)
    
    if (!taskToEdit) {
      return `请指定要编辑的任务。当前可用任务：\n${allTasks.map((t, i) => `${i+1}. ${t.title}`).join('\n')}`
    }
    
    // 解析更新信息
    const updates = await this.parseUpdateInfo(input)
    
    if (Object.keys(updates).length === 0) {
      return `请提供要修改的内容。可以修改任务标题、截止日期、截止时间或优先级。\n当前任务信息：\n${AITaskService.formatTaskForAI(taskToEdit)}`
    }
    
    try {
      const updatedTask = await AITaskService.editTask(taskToEdit.id, updates)
      return `任务编辑成功！\n\n更新后的任务信息：\n${AITaskService.formatTaskForAI(updatedTask)}`
    } catch (error) {
      return `编辑任务失败：${error.message}`
    }
  }

  /**
   * 判断是否为删除请求
   */
  static isDeleteRequest(input) {
    const deleteKeywords = ['删除', '移除', '取消', '删掉', '删除任务']
    return deleteKeywords.some(keyword => input.includes(keyword))
  }

  /**
   * 处理删除请求
   */
  static async handleDeleteRequest(input) {
    const allTasks = await AITaskService.getAllTasks()
    
    if (allTasks.length === 0) {
      return '当前没有任务可以删除。'
    }
    
    const taskToDelete = this.findTaskByTitle(input, allTasks)
    
    if (!taskToDelete) {
      return `请指定要删除的任务。当前可用任务：\n${allTasks.map((t, i) => `${i+1}. ${t.title}`).join('\n')}`
    }
    
    try {
      await AITaskService.deleteTask(taskToDelete.id)
      return `任务 "${taskToDelete.title}" 已成功删除！`
    } catch (error) {
      return `删除任务失败：${error.message}`
    }
  }

  /**
   * 判断是否为切换状态请求
   */
  static isToggleRequest(input) {
    const toggleKeywords = ['完成', '标记完成', '设为完成', '待办', '标记待办', '设为待办']
    return toggleKeywords.some(keyword => input.includes(keyword))
  }

  /**
   * 处理状态切换请求
   */
  static async handleToggleRequest(input) {
    const allTasks = await AITaskService.getAllTasks()
    
    if (allTasks.length === 0) {
      return '当前没有任务可以操作。'
    }
    
    const taskToToggle = this.findTaskByTitle(input, allTasks)
    
    if (!taskToToggle) {
      return `请指定要操作的任务。当前可用任务：\n${allTasks.map((t, i) => `${i+1}. ${t.title}`).join('\n')}`
    }
    
    const shouldComplete = input.includes('完成')
    
    try {
      const updatedTask = await AITaskService.toggleTask(taskToToggle.id, shouldComplete)
      const status = shouldComplete ? '已完成' : '待办'
      return `任务 "${taskToToggle.title}" 已标记为 ${status}！\n\n${AITaskService.formatTaskForAI(updatedTask)}`
    } catch (error) {
      return `切换任务状态失败：${error.message}`
    }
  }

  /**
   * 判断是否为统计请求
   */
  static isStatisticsRequest(input) {
    const statKeywords = ['统计', '统计信息', '任务统计', '进度', '完成率']
    return statKeywords.some(keyword => input.includes(keyword))
  }

  /**
   * 处理统计请求
   */
  static async handleStatisticsRequest() {
    try {
      const stats = await AITaskService.getTaskStatistics()
      
      return `任务统计信息：\n\n` +
             `• 总任务数：${stats.total}\n` +
             `• 已完成：${stats.completed}\n` +
             `• 待完成：${stats.incomplete}\n` +
             `• 逾期任务：${stats.overdue}\n` +
             `• 今日任务：${stats.today}\n` +
             `• 完成率：${stats.completionRate}%`
    } catch (error) {
      return `获取统计信息失败：${error.message}`
    }
  }

  /**
   * 判断是否为搜索请求
   */
  static isSearchRequest(input) {
    const searchKeywords = ['搜索', '查找', '查询', '搜索任务', '查找任务']
    return searchKeywords.some(keyword => input.includes(keyword))
  }

  /**
   * 处理搜索请求
   */
  static async handleSearchRequest(input) {
    // 提取搜索关键词
    const searchTerm = this.extractSearchTerm(input)
    
    if (!searchTerm) {
      return '请输入要搜索的关键词。例如："搜索会议" 或 "查找明天"'
    }
    
    try {
      const tasks = await AITaskService.searchTasks(searchTerm)
      return `搜索 "${searchTerm}" 的结果：\n\n${AITaskService.formatTasksForAI(tasks)}`
    } catch (error) {
      return `搜索失败：${error.message}`
    }
  }

  /**
   * 根据标题查找任务
   */
  static findTaskByTitle(input, tasks) {
    // 移除编辑关键词，保留原始内容用于匹配
    const cleanInput = input.replace(/修改|编辑|更新|更改|删除|移除|完成|标记|时间|日期|改为|改成/g, '').trim()
    
    // 提取可能的关键词进行匹配
    const keywords = this.extractKeywordsForMatching(cleanInput)
    
    // 优先查找完全匹配的任务
    const exactMatches = tasks.filter(task => 
      cleanInput.toLowerCase().includes(task.title.toLowerCase()) ||
      task.title.toLowerCase().includes(cleanInput.toLowerCase())
    )
    
    if (exactMatches.length === 1) {
      return exactMatches[0]
    }
    
    // 如果没有完全匹配，尝试关键词匹配
    const keywordMatches = tasks.filter(task => 
      keywords.some(keyword => 
        task.title.toLowerCase().includes(keyword) ||
        keyword.includes(task.title.toLowerCase())
      )
    )
    
    if (keywordMatches.length === 1) {
      return keywordMatches[0]
    }
    
    // 如果有多重匹配，返回最相关的任务
    if (keywordMatches.length > 0) {
      // 优先选择包含度最高的任务
      return keywordMatches.reduce((best, current) => 
        this.calculateRelevanceScore(current.title, cleanInput) > 
        this.calculateRelevanceScore(best.title, cleanInput) ? current : best
      )
    }
    
    // 最后尝试部分匹配
    for (const task of tasks) {
      const taskWords = task.title.toLowerCase().split(/[\s\-\_]+/)
      const inputWords = cleanInput.toLowerCase().split(/[\s\-\_]+/)
      
      const commonWords = taskWords.filter(word => 
        inputWords.some(inputWord => 
          word.includes(inputWord) || inputWord.includes(word)
        )
      )
      
      if (commonWords.length > 0) {
        return task
      }
    }
    
    return null
  }
  
  /**
   * 提取用于匹配的关键词
   */
  static extractKeywordsForMatching(input) {
    const commonWords = ['的', '和', '与', '或', '在', '到', '从', '为', '给', '把', '被', '让', '使']
    
    return input
      .split(/[\s\-\_]+/)
      .filter(word => 
        word.length > 1 && 
        !commonWords.includes(word) &&
        !this.isDateOrTimeWord(word)
      )
      .map(word => word.toLowerCase())
  }
  
  /**
   * 判断是否为日期时间相关词汇
   */
  static isDateOrTimeWord(word) {
    const timeWords = ['时间', '日期', '时候', '几点', '何时', '什么时间', '开始', '结束', '上午', '下午', '晚上', '明天', '后天', '今天']
    const numberWords = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    
    return timeWords.some(timeWord => word.includes(timeWord)) ||
           numberWords.some(numWord => word.includes(numWord))
  }
  
  /**
   * 计算任务标题与输入的相关性分数
   */
  static calculateRelevanceScore(taskTitle, input) {
    const titleWords = taskTitle.toLowerCase().split(/[\s\-\_]+/)
    const inputWords = input.toLowerCase().split(/[\s\-\_]+/)
    
    let score = 0
    
    // 计算共同词汇数量
    const commonWords = inputWords.filter(inputWord => 
      titleWords.some(titleWord => 
        titleWord.includes(inputWord) || inputWord.includes(titleWord)
      )
    )
    
    score += commonWords.length * 10
    
    // 计算字符匹配度
    const maxLength = Math.max(taskTitle.length, input.length)
    const minLength = Math.min(taskTitle.length, input.length)
    
    if (maxLength > 0) {
      score += (minLength / maxLength) * 20
    }
    
    return score
  }

  /**
   * 解析更新信息 - 应用统一的时间识别逻辑
   */
  static async parseUpdateInfo(input) {
    const updates = {}
    
    // 提取新标题
    if (input.includes('改为') || input.includes('改成') || input.includes('修改为')) {
      const titleMatch = input.match(/改为\s*(.+?)(?:，|。|$)/)
      if (titleMatch) {
        updates.title = titleMatch[1].trim()
      }
    }
    
    // 使用统一的日期解析器来提取日期和时间信息
    const parsedInfo = await smartParseTodo(input)
    
    // 日期和时间处理
    if (parsedInfo.dueDate) {
      updates.dueDate = parsedInfo.dueDate
    }
    
    if (parsedInfo.dueTime) {
      updates.dueTime = parsedInfo.dueTime
    }
    
    // 提取优先级
    if (input.includes('高优先级') || input.includes('设为重要') || input.includes('重要')) {
      updates.priority = 'high'
    } else if (input.includes('低优先级') || input.includes('设为不急') || input.includes('不急')) {
      updates.priority = 'low'
    } else if (input.includes('中优先级') || input.includes('设为普通') || input.includes('普通')) {
      updates.priority = 'medium'
    }
    
    return updates
  }

  /**
   * 提取搜索关键词
   */
  static extractSearchTerm(input) {
    return input.replace(/搜索|查找|查询|任务/g, '').trim()
  }

  /**
   * 智能提取任务标题
   */
  static extractTaskTitle(input) {
    // 移除常见的关键词和标点
    let cleanInput = input
      .replace(/添加|创建|新建|增加|任务|提醒|记一下|记录|设置|安排|帮我|需要|想|打算|计划|准备/g, '')
      .replace(/[：:，,。.！!？?；;]/g, ' ')
      .trim()
    
    // 如果输入是简单的自然语言，直接返回
    if (cleanInput.length > 0 && cleanInput.length < 50) {
      return cleanInput
    }
    
    // 尝试提取具体的事件描述
    const eventPatterns = [
      /(开会|会议|学习|工作|健身|购物|约会|吃饭|睡觉|工作|上班|下班)/g,
      /(报告|汇报|项目|任务|事情|事项)/g
    ]
    
    for (const pattern of eventPatterns) {
      const match = cleanInput.match(pattern)
      if (match) {
        // 提取匹配词前后的内容
        const index = cleanInput.indexOf(match[0])
        const start = Math.max(0, index - 20)
        const end = Math.min(cleanInput.length, index + match[0].length + 20)
        const extracted = cleanInput.substring(start, end).trim()
        
        if (extracted.length > 0 && extracted.length < 50) {
          return extracted
        }
      }
    }
    
    // 如果以上方法都失败，返回原始输入（移除关键词）
    const titleMatch = input.replace(/添加|创建|新建|增加|任务|提醒|记一下|记录|设置|安排|帮我|需要|想|打算|计划|准备/g, '').trim()
    return titleMatch || '任务'
  }

  /**
   * 增强日期解析功能 - 全面应用统一的时间识别逻辑
   */
  static async parseTaskInfo(input) {
    const taskInfo = {}
    
    // 使用统一的日期解析器（与列表界面保持一致）
    const parsedInfo = await smartParseTodo(input)
    
    // 应用解析结果
    if (parsedInfo.title) {
      taskInfo.title = parsedInfo.title
    } else {
      // 如果统一解析器没有解析到标题，尝试智能提取标题
      const extractedTitle = this.extractTaskTitle(input)
      if (extractedTitle) {
        taskInfo.title = extractedTitle
      } else {
        // 最后尝试移除关键词提取标题
        const titleMatch = input.replace(/添加|创建|新建|增加|任务|提醒|记一下|记录|设置|安排|帮我|需要|想|打算|计划|准备/g, '').trim()
        if (titleMatch) {
          taskInfo.title = titleMatch
        }
      }
    }
    
    // 日期和时间处理
    if (parsedInfo.dueDate) {
      taskInfo.dueDate = parsedInfo.dueDate
    } else {
      // 如果没有解析到日期，设置默认日期为当天
      taskInfo.dueDate = dayjs().format('YYYY-MM-DD')
      console.log(`📅 AI助手设置默认日期: ${taskInfo.dueDate}`)
    }
    
    if (parsedInfo.dueTime) {
      taskInfo.dueTime = parsedInfo.dueTime
    }
    
    // 优先级处理
    if (input.includes('高优先级') || input.includes('重要') || input.includes('紧急')) {
      taskInfo.priority = 'high'
    } else if (input.includes('低优先级') || input.includes('不急') || input.includes('普通')) {
      taskInfo.priority = 'low'
    } else {
      // 如果没有明确指定优先级，使用智能优先级判断
      taskInfo.priority = parsedInfo.priority || 'medium'
    }
    
    return taskInfo
  }

  /**
   * 增强日期标准化功能
   */
  static normalizeDate(dateStr) {
    if (!dateStr) return null
    
    // 处理相对日期
    const relativeDates = {
      '今天': 0,
      '今晚': 0,
      '今早': 0,
      '今日': 0,
      '明天': 1,
      '后天': 2,
      '大后天': 3,
      '下周': 7,
      '下个月': 30
    }
    
    for (const [key, days] of Object.entries(relativeDates)) {
      if (dateStr.includes(key)) {
        return dayjs().add(days, 'day').format('YYYY-MM-DD')
      }
    }
    
    // 处理星期
    const weekDays = {
      '星期一': 1,
      '星期二': 2,
      '星期三': 3,
      '星期四': 4,
      '星期五': 5,
      '星期六': 6,
      '星期日': 7,
      '星期天': 7
    }
    
    for (const [key, targetDay] of Object.entries(weekDays)) {
      if (dateStr.includes(key)) {
        const today = dayjs().day()
        const daysToAdd = targetDay > today ? targetDay - today : 7 - today + targetDay
        return dayjs().add(daysToAdd, 'day').format('YYYY-MM-DD')
      }
    }
    
    // 处理中文日期格式
    const chineseDateMatch = dateStr.match(/(\d+)月(\d+)日/)
    if (chineseDateMatch) {
      const month = parseInt(chineseDateMatch[1])
      const day = parseInt(chineseDateMatch[2])
      const year = dayjs().year()
      return dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD')
    }
    
    // 处理只有日期的格式
    const dayOnlyMatch = dateStr.match(/(\d+)日/)
    if (dayOnlyMatch) {
      const day = parseInt(dayOnlyMatch[1])
      const year = dayjs().year()
      const month = dayjs().month() + 1
      return dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD')
    }
    
    // 处理标准日期格式
    if (dayjs(dateStr, 'YYYY-MM-DD', true).isValid()) {
      return dateStr
    }
    
    return null
  }

  /**
   * 标准化时间格式
   */
  static normalizeTime(timeStr) {
    if (!timeStr) return null
    
    // 处理标准时间格式
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`
    }
    
    // 处理中文时间格式
    const chineseTimeMatch = timeStr.match(/(\d{1,2})点/)
    if (chineseTimeMatch) {
      const hour = parseInt(chineseTimeMatch[1])
      return `${hour}:00`
    }
    
    // 处理带时间段的时间
    const periodMatch = timeStr.match(/(上午|下午|晚上|早上|傍晚|中午)\s*(\d{1,2})/)
    if (periodMatch) {
      const period = periodMatch[1]
      let hour = parseInt(periodMatch[2])
      
      if (['下午', '晚上'].includes(period) && hour < 12) {
        hour += 12
      }
      
      return `${hour}:00`
    }
    
    return null
  }

  /**
   * 获取帮助信息
   */
  static getHelpMessage() {
    return `🤖 **AI任务助手 - 功能指南**\n\n` +
           `📋 **查询任务**\n` +
           `• "显示所有任务"\n` +
           `• "查看待办任务"\n` +
           `• "今日任务有哪些"\n` +
           `• "逾期任务列表"\n` +
           `• "查看已完成任务"\n\n` +
           `➕ **添加任务 - 支持多种自然语言格式**\n` +
           `• "添加任务：明天上午9点开会"\n` +
           `• "明天要开会"\n` +
           `• "记一下后天下午的会议"\n` +
           `• "提醒我今晚学习"\n` +
           `• "帮我设置明天上午的健身计划"\n` +
           `• "下周一出差准备报告"\n` +
           `• "下个月15号交房租"\n\n` +
           `✏️ **编辑任务**\n` +
           `• "修改会议时间为后天"\n` +
           `• "编辑任务标题为新的内容"\n` +
           `• "将会议优先级设为高"\n\n` +
           `🗑️ **删除任务**\n` +
           `• "删除会议任务"\n` +
           `• "移除已完成任务"\n\n` +
           `✅ **状态切换**\n` +
           `• "标记任务为已完成"\n` +
           `• "设为待办状态"\n\n` +
           `📊 **统计信息**\n` +
           `• "任务统计"\n` +
           `• "查看完成率"\n` +
           `• "显示任务进度"\n\n` +
           `🔍 **搜索任务**\n` +
           `• "搜索会议"\n` +
           `• "查找明天的任务"\n` +
           `• "查询重要任务"\n\n` +
           `💡 **智能特性**\n` +
           `• 支持中文自然语言理解\n` +
           `• 自动识别日期和时间\n` +
           `• 智能提取任务标题\n` +
           `• 优先级自动设置\n\n` +
           `请用自然语言告诉我您想做什么，我会帮您处理！`
  }
}