import { ReminderService } from './todoService.js'
import { supabase } from '../config/supabase.js'

class ReminderScheduler {
  constructor() {
    this.intervalId = null
    this.isRunning = false
    this.checkInterval = 60000 // 每分钟检查一次
  }

  // 启动提醒服务
  async start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('提醒服务已启动')
    
    // 立即检查一次
    await this.checkReminders()
    
    // 设置定时器
    this.intervalId = setInterval(() => {
      this.checkReminders()
    }, this.checkInterval)
  }

  // 停止提醒服务
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('提醒服务已停止')
  }

  // 检查并处理待发送的提醒
  async checkReminders() {
    try {
      const pendingReminders = await ReminderService.getPendingReminders()
      
      if (pendingReminders && pendingReminders.length > 0) {
        console.log(`发现 ${pendingReminders.length} 个待发送提醒`)
        
        for (const reminder of pendingReminders) {
          await this.processReminder(reminder)
        }
      }
    } catch (error) {
      console.error('检查提醒时出错:', error)
    }
  }

  // 处理单个提醒
  async processReminder(reminder) {
    try {
      console.log('处理提醒:', reminder.id, reminder.todos?.title)
      
      // 发送WebPush通知
      await ReminderService.sendWebPushReminder(reminder)
      
      // 获取用户信息以发送邮件
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        // 发送邮件提醒（如果用户开启了邮件通知）
        await ReminderService.sendEmailReminder(reminder, user.email)
      }
      
      // 标记提醒为已发送
      await ReminderService.markReminderSent(reminder.id)
      
      console.log('提醒处理完成:', reminder.id)
      
    } catch (error) {
      console.error('处理提醒时出错:', error)
    }
  }

  // 获取服务状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval
    }
  }
}

// 创建全局实例
export const reminderScheduler = new ReminderScheduler()

// 自动启动服务（当用户登录时）
export function initReminderService() {
  // 监听认证状态变化
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('用户已登录，启动提醒服务')
        await reminderScheduler.start()
      } else if (event === 'SIGNED_OUT') {
        console.log('用户已登出，停止提醒服务')
        reminderScheduler.stop()
      }
    }
  )
  
  return subscription
}