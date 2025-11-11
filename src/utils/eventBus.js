/**
 * 全局事件总线
 * 用于组件间的数据同步和通信
 */

export class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * 监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   * @returns {Function} 取消监听函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    
    // 返回取消监听函数
    return () => this.off(event, callback)
  }

  /**
   * 取消监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {any} data 事件数据
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      // 使用 setTimeout 确保在下一个事件循环中执行，避免阻塞
      setTimeout(() => {
        callbacks.forEach(callback => {
          try {
            callback(data)
          } catch (error) {
            console.error(`事件处理错误 [${event}]:`, error)
          }
        })
      }, 0)
    }
  }

  /**
   * 一次性监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }

  /**
   * 清除所有监听器
   */
  clear() {
    this.listeners.clear()
  }

  /**
   * 获取事件监听器数量
   * @param {string} event 事件名称
   * @returns {number} 监听器数量
   */
  listenerCount(event) {
    const callbacks = this.listeners.get(event)
    return callbacks ? callbacks.size : 0
  }
}

// 创建全局实例
export const eventBus = new EventBus()

// 事件常量
export const EVENT_TYPES = {
  // 任务相关事件
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated', 
  TASK_DELETED: 'task:deleted',
  TASK_TOGGLED: 'task:toggled',
  
  // 任务列表相关事件
  TASKS_LOADED: 'tasks:loaded',
  TASKS_REFRESH: 'tasks:refresh',
  
  // AI助手相关事件
  AI_TASK_PROCESSED: 'ai:task-processed',
  AI_RESPONSE_RECEIVED: 'ai:response-received',
  
  // 用户界面事件
  UI_REFRESH_REQUIRED: 'ui:refresh-required',
  
  // 错误事件
  ERROR_OCCURRED: 'error:occurred'
}

// 事件数据格式
export const EVENT_DATA_FORMATS = {
  [EVENT_TYPES.TASK_CREATED]: {
    task: 'object', // 新创建的任务对象
    source: 'string' // 事件来源: 'ai' | 'manual' | 'sync'
  },
  
  [EVENT_TYPES.TASK_UPDATED]: {
    taskId: 'string', // 任务ID
    updates: 'object', // 更新的字段
    oldTask: 'object', // 更新前的任务对象
    newTask: 'object', // 更新后的任务对象
    source: 'string'
  },
  
  [EVENT_TYPES.TASK_DELETED]: {
    taskId: 'string', // 删除的任务ID
    taskTitle: 'string', // 删除的任务标题（用于显示）
    source: 'string'
  },
  
  [EVENT_TYPES.TASK_TOGGLED]: {
    taskId: 'string', // 任务ID
    completed: 'boolean', // 新的完成状态
    source: 'string'
  },
  
  [EVENT_TYPES.TASKS_LOADED]: {
    tasks: 'array', // 加载的任务列表
    count: 'number', // 任务数量
    source: 'string'
  },
  
  [EVENT_TYPES.AI_TASK_PROCESSED]: {
    action: 'string', // 处理的操作: 'create' | 'update' | 'delete' | 'toggle'
    result: 'object', // 处理结果
    userInput: 'string', // 用户输入
    timestamp: 'number' // 时间戳
  }
}

// 快捷方法
export const EventEmitter = {
  // 任务相关快捷方法
  taskCreated(task, source = 'manual') {
    eventBus.emit(EVENT_TYPES.TASK_CREATED, { task, source })
  },
  
  taskUpdated(taskId, updates, oldTask, newTask, source = 'manual') {
    eventBus.emit(EVENT_TYPES.TASK_UPDATED, { 
      taskId, updates, oldTask, newTask, source 
    })
  },
  
  taskDeleted(taskId, taskTitle, source = 'manual') {
    eventBus.emit(EVENT_TYPES.TASK_DELETED, { taskId, taskTitle, source })
  },
  
  taskToggled(taskId, completed, source = 'manual') {
    eventBus.emit(EVENT_TYPES.TASK_TOGGLED, { taskId, completed, source })
  },
  
  tasksLoaded(tasks, source = 'initial') {
    eventBus.emit(EVENT_TYPES.TASKS_LOADED, { 
      tasks, count: tasks.length, source 
    })
  },
  
  // AI助手相关快捷方法
  aiTaskProcessed(action, result, userInput) {
    eventBus.emit(EVENT_TYPES.AI_TASK_PROCESSED, {
      action,
      result,
      userInput,
      timestamp: Date.now()
    })
  },
  
  // 通用方法
  refreshUI() {
    eventBus.emit(EVENT_TYPES.UI_REFRESH_REQUIRED)
  },
  
  emitError(error, context = 'unknown') {
    console.error(`[${context}]`, error)
    eventBus.emit(EVENT_TYPES.ERROR_OCCURRED, { error, context })
  }
}

// 默认导出全局实例
export default eventBus