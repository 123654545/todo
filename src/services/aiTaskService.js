import { TodoService } from './todoService.js'
import dayjs from 'dayjs'
import { EventEmitter } from '../utils/eventBus.js'

/**
 * AI任务管理服务
 * 连接AI助手和实际的任务管理功能
 */
export class AITaskService {
  
  /**
   * 获取所有任务
   * @returns {Promise<Array>} 任务列表
   */
  static async getAllTasks() {
    try {
      const todos = await TodoService.getTodos()
      return todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        dueDate: todo.due_date,
        dueTime: todo.due_time,
        priority: todo.priority,
        createdAt: todo.created_at,
        updatedAt: todo.updated_at
      }))
    } catch (error) {
      console.error('获取任务列表失败:', error)
      throw new Error('无法获取任务列表，请检查网络连接')
    }
  }

  /**
   * 获取任务统计信息
   * @returns {Promise<Object>} 任务统计
   */
  static async getTaskStatistics() {
    try {
      const todos = await this.getAllTasks()
      
      const total = todos.length
      const completed = todos.filter(todo => todo.completed).length
      const overdue = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false
        const dueDateTime = `${todo.dueDate} ${todo.dueTime || '23:59'}`
        return dayjs(dueDateTime).isBefore(dayjs())
      }).length
      
      const today = todos.filter(todo => {
        if (!todo.dueDate) return false
        return dayjs(todo.dueDate).isSame(dayjs(), 'day')
      }).length
      
      return {
        total,
        completed,
        incomplete: total - completed,
        overdue,
        today,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    } catch (error) {
      console.error('获取任务统计失败:', error)
      throw new Error('无法获取任务统计信息')
    }
  }

  /**
   * 搜索任务
   * @param {string} query 搜索关键词
   * @param {string} filter 筛选条件
   * @returns {Promise<Array>} 搜索结果
   */
  static async searchTasks(query, filter = 'all') {
    try {
      const todos = await this.getAllTasks()
      
      if (!query.trim()) {
        return todos
      }

      const searchQuery = query.toLowerCase()
      return todos.filter(todo => {
        if (filter === 'title') {
          return todo.title.toLowerCase().includes(searchQuery)
        } else if (filter === 'date') {
          return todo.dueDate && todo.dueDate.includes(searchQuery)
        } else if (filter === 'priority') {
          return todo.priority && todo.priority.toLowerCase().includes(searchQuery)
        } else {
          return todo.title.toLowerCase().includes(searchQuery) || 
                 (todo.dueDate && todo.dueDate.includes(searchQuery)) ||
                 (todo.priority && todo.priority.toLowerCase().includes(searchQuery))
        }
      })
    } catch (error) {
      console.error('搜索任务失败:', error)
      throw new Error('搜索任务失败，请检查搜索条件')
    }
  }

  /**
   * 添加任务
   * @param {Object} taskData 任务数据
   * @param {string} taskData.title 任务标题
   * @param {string} taskData.dueDate 截止日期
   * @param {string} taskData.dueTime 截止时间
   * @param {string} taskData.priority 优先级
   * @returns {Promise<Object>} 新创建的任务
   */
  static async addTask(taskData) {
    try {
      const { title, dueDate, dueTime, priority = 'medium' } = taskData
      
      if (!title || !title.trim()) {
        throw new Error('任务标题不能为空')
      }

      // 验证日期格式
      if (dueDate && !this.isValidDate(dueDate)) {
        throw new Error('截止日期格式不正确，请使用YYYY-MM-DD格式')
      }

      // 验证时间格式
      if (dueTime && !this.isValidTime(dueTime)) {
        throw new Error('截止时间格式不正确，请使用HH:mm格式')
      }

      // 验证优先级
      if (priority && !['high', 'medium', 'low'].includes(priority)) {
        throw new Error('优先级必须是 high、medium 或 low')
      }

      const newTodo = await TodoService.createTodo({
        title: title.trim(),
        due_date: dueDate || null,
        due_time: dueTime || null,
        priority
      })

      const task = {
        id: newTodo.id,
        title: newTodo.title,
        completed: newTodo.completed,
        dueDate: newTodo.due_date,
        dueTime: newTodo.due_time,
        priority: newTodo.priority
      }

      // 发布任务创建事件
      EventEmitter.taskCreated(task, 'ai')

      return task
    } catch (error) {
      console.error('添加任务失败:', error)
      throw new Error(`添加任务失败: ${error.message}`)
    }
  }

  /**
   * 编辑任务
   * @param {string} taskId 任务ID
   * @param {Object} updates 更新数据
   * @returns {Promise<Object>} 更新后的任务
   */
  static async editTask(taskId, updates) {
    try {
      // 验证任务是否存在
      const todos = await this.getAllTasks()
      const existingTask = todos.find(todo => todo.id === taskId)
      
      if (!existingTask) {
        throw new Error('任务不存在')
      }

      // 验证更新数据
      if (updates.title && (!updates.title.trim() || updates.title.trim().length === 0)) {
        throw new Error('任务标题不能为空')
      }

      if (updates.dueDate && !this.isValidDate(updates.dueDate)) {
        throw new Error('截止日期格式不正确')
      }

      if (updates.dueTime && !this.isValidTime(updates.dueTime)) {
        throw new Error('截止时间格式不正确')
      }

      if (updates.priority && !['high', 'medium', 'low'].includes(updates.priority)) {
        throw new Error('优先级必须是 high、medium 或 low')
      }

      const updatedTodo = await TodoService.updateTodo(taskId, {
        title: updates.title || existingTask.title,
        due_date: updates.dueDate !== undefined ? updates.dueDate : existingTask.dueDate,
        due_time: updates.dueTime !== undefined ? updates.dueTime : existingTask.dueTime,
        priority: updates.priority || existingTask.priority
      })

      const newTask = {
        id: updatedTodo.id,
        title: updatedTodo.title,
        completed: updatedTodo.completed,
        dueDate: updatedTodo.due_date,
        dueTime: updatedTodo.due_time,
        priority: updatedTodo.priority
      }

      // 发布任务更新事件
      EventEmitter.taskUpdated(taskId, updates, existingTask, newTask, 'ai')

      return newTask
    } catch (error) {
      console.error('编辑任务失败:', error)
      throw new Error(`编辑任务失败: ${error.message}`)
    }
  }

  /**
   * 删除任务
   * @param {string} taskId 任务ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  static async deleteTask(taskId) {
    try {
      // 验证任务是否存在
      const todos = await this.getAllTasks()
      const existingTask = todos.find(todo => todo.id === taskId)
      
      if (!existingTask) {
        throw new Error('任务不存在')
      }

      await TodoService.deleteTodo(taskId)
      
      // 发布任务删除事件
      EventEmitter.taskDeleted(taskId, existingTask.title, 'ai')
      
      return true
    } catch (error) {
      console.error('删除任务失败:', error)
      throw new Error(`删除任务失败: ${error.message}`)
    }
  }

  /**
   * 切换任务完成状态
   * @param {string} taskId 任务ID
   * @param {boolean} completed 完成状态
   * @returns {Promise<Object>} 更新后的任务
   */
  static async toggleTask(taskId, completed) {
    try {
      const updatedTodo = await TodoService.toggleTodo(taskId, completed)
      
      const task = {
        id: updatedTodo.id,
        title: updatedTodo.title,
        completed: updatedTodo.completed,
        dueDate: updatedTodo.due_date,
        dueTime: updatedTodo.due_time,
        priority: updatedTodo.priority
      }
      
      // 发布任务状态切换事件
      EventEmitter.taskToggled(taskId, completed, 'ai')
      
      return task
    } catch (error) {
      console.error('切换任务状态失败:', error)
      throw new Error(`切换任务状态失败: ${error.message}`)
    }
  }

  /**
   * 获取待办任务列表
   * @returns {Promise<Array>} 待办任务列表
   */
  static async getPendingTasks() {
    try {
      const todos = await this.getAllTasks()
      return todos.filter(todo => !todo.completed)
    } catch (error) {
      console.error('获取待办任务失败:', error)
      throw new Error('无法获取待办任务列表')
    }
  }

  /**
   * 获取已完成任务列表
   * @returns {Promise<Array>} 已完成任务列表
   */
  static async getCompletedTasks() {
    try {
      const todos = await this.getAllTasks()
      return todos.filter(todo => todo.completed)
    } catch (error) {
      console.error('获取已完成任务失败:', error)
      throw new Error('无法获取已完成任务列表')
    }
  }

  /**
   * 获取逾期任务列表
   * @returns {Promise<Array>} 逾期任务列表
   */
  static async getOverdueTasks() {
    try {
      const todos = await this.getAllTasks()
      return todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false
        const dueDateTime = `${todo.dueDate} ${todo.dueTime || '23:59'}`
        return dayjs(dueDateTime).isBefore(dayjs())
      })
    } catch (error) {
      console.error('获取逾期任务失败:', error)
      throw new Error('无法获取逾期任务列表')
    }
  }

  /**
   * 获取今日任务列表
   * @returns {Promise<Array>} 今日任务列表
   */
  static async getTodayTasks() {
    try {
      const todos = await this.getAllTasks()
      return todos.filter(todo => {
        if (!todo.dueDate) return false
        return dayjs(todo.dueDate).isSame(dayjs(), 'day')
      })
    } catch (error) {
      console.error('获取今日任务失败:', error)
      throw new Error('无法获取今日任务列表')
    }
  }

  /**
   * 验证日期格式
   * @param {string} date 日期字符串
   * @returns {boolean} 是否有效
   */
  static isValidDate(date) {
    return dayjs(date, 'YYYY-MM-DD', true).isValid()
  }

  /**
   * 验证时间格式
   * @param {string} time 时间字符串
   * @returns {boolean} 是否有效
   */
  static isValidTime(time) {
    return dayjs(time, 'HH:mm', true).isValid()
  }

  /**
   * 格式化任务信息用于AI回复
   * @param {Object} task 任务对象
   * @returns {string} 格式化后的任务信息
   */
  static formatTaskForAI(task) {
    const status = task.completed ? '已完成' : '待完成'
    const priorityMap = { high: '高', medium: '中', low: '低' }
    const priority = priorityMap[task.priority] || task.priority
    
    let info = `任务：${task.title}\n状态：${status}\n优先级：${priority}`
    
    if (task.dueDate) {
      const formattedDate = dayjs(task.dueDate).format('YYYY年MM月DD日')
      info += `\n截止日期：${formattedDate}`
      
      if (task.dueTime) {
        info += ` ${task.dueTime}`
      }
    }
    
    return info
  }

  /**
   * 格式化任务列表用于AI回复
   * @param {Array} tasks 任务列表
   * @returns {string} 格式化后的任务列表
   */
  static formatTasksForAI(tasks) {
    if (tasks.length === 0) {
      return '没有找到任何任务'
    }

    let result = `共找到 ${tasks.length} 个任务：\n\n`
    
    tasks.forEach((task, index) => {
      result += `${index + 1}. ${this.formatTaskForAI(task)}\n\n`
    })
    
    return result
  }
}