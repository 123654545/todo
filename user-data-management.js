// 用户数据管理脚本
// 用于在Supabase中查看和管理所有用户数据

import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://lfjzcmxtmojzybmwrfhf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmanpjbXh0bW9qenlibXdyZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDk4NDEsImV4cCI6MjA3NjQ4NTg0MX0.d9e5k_OnBkfLdv7KufswZujh1N4B_Om98lU9S43iuwk'

const supabase = createClient(supabaseUrl, supabaseKey)

// 用户数据管理类
class UserDataManager {
  
  // 获取所有用户及其完整信息
  static async getAllUsers() {
    try {
      console.log('正在获取所有用户信息...')
      
      // 获取所有认证用户
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      if (usersError) throw usersError
      
      console.log(`找到 ${users.users.length} 个用户`)
      
      const userDetails = []
      
      for (const user of users.users) {
        console.log(`处理用户: ${user.email}`)
        
        // 获取用户档案
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        // 获取用户设置
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        // 获取用户统计
        const { data: stats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        // 获取用户任务数量
        const { data: todos, error: todosError } = await supabase
          .from('todos')
          .select('id, completed, due_date, priority')
          .eq('user_id', user.id)
        
        // 获取登录记录
        const { data: loginLogs } = await supabase
          .from('user_login_logs')
          .select('login_at, success')
          .eq('user_id', user.id)
          .order('login_at', { ascending: false })
          .limit(5)
        
        const userInfo = {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in: user.last_sign_in_at,
          profile: profile || {},
          settings: settings || {},
          stats: stats || {},
          todos_count: todos ? todos.length : 0,
          completed_todos: todos ? todos.filter(t => t.completed).length : 0,
          overdue_todos: todos ? todos.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed).length : 0,
          login_logs: loginLogs || [],
          data_completeness: {
            has_profile: !!profile,
            has_settings: !!settings,
            has_stats: !!stats,
            has_todos: todos && todos.length > 0
          }
        }
        
        userDetails.push(userInfo)
      }
      
      return userDetails
      
    } catch (error) {
      console.error('获取用户数据失败:', error)
      throw error
    }
  }
  
  // 显示用户统计信息
  static async showUserStatistics() {
    try {
      const users = await this.getAllUsers()
      
      console.log('\n=== 用户统计信息 ===')
      console.log(`总用户数: ${users.length}`)
      
      const activeUsers = users.filter(u => u.last_sign_in && new Date(u.last_sign_in) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      console.log(`活跃用户数(30天内): ${activeUsers.length}`)
      
      const usersWithTodos = users.filter(u => u.todos_count > 0)
      console.log(`有任务的用户数: ${usersWithTodos.length}`)
      
      const avgTodos = usersWithTodos.length > 0 
        ? (usersWithTodos.reduce((sum, u) => sum + u.todos_count, 0) / usersWithTodos.length).toFixed(1)
        : 0
      console.log(`平均任务数: ${avgTodos}`)
      
      const completionRate = usersWithTodos.length > 0
        ? (usersWithTodos.reduce((sum, u) => sum + (u.completed_todos / u.todos_count), 0) / usersWithTodos.length * 100).toFixed(1)
        : 0
      console.log(`平均完成率: ${completionRate}%`)
      
      console.log('\n=== 数据完整性 ===')
      const completeness = {
        profiles: users.filter(u => u.data_completeness.has_profile).length,
        settings: users.filter(u => u.data_completeness.has_settings).length,
        stats: users.filter(u => u.data_completeness.has_stats).length,
        todos: users.filter(u => u.data_completeness.has_todos).length
      }
      
      Object.entries(completeness).forEach(([key, count]) => {
        const percentage = ((count / users.length) * 100).toFixed(1)
        console.log(`${key}: ${count}/${users.length} (${percentage}%)`)
      })
      
    } catch (error) {
      console.error('显示统计信息失败:', error)
    }
  }
  
  // 显示用户详细信息
  static async showUserDetails(emailFilter = '') {
    try {
      const users = await this.getAllUsers()
      
      const filteredUsers = emailFilter 
        ? users.filter(u => u.email.toLowerCase().includes(emailFilter.toLowerCase()))
        : users
      
      console.log(`\n=== 用户详细信息 (${filteredUsers.length} 个用户) ===`)
      
      filteredUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`)
        console.log(`   用户ID: ${user.id}`)
        console.log(`   注册时间: ${new Date(user.created_at).toLocaleString('zh-CN')}`)
        console.log(`   最后登录: ${user.last_sign_in ? new Date(user.last_sign_in).toLocaleString('zh-CN') : '从未登录'}`)
        console.log(`   显示名称: ${user.profile.display_name || '未设置'}`)
        console.log(`   任务统计: ${user.todos_count} 个任务 (${user.completed_todos} 已完成, ${user.overdue_todos} 已逾期)`)
        console.log(`   完成率: ${user.todos_count > 0 ? ((user.completed_todos / user.todos_count) * 100).toFixed(1) : 0}%`)
        console.log(`   数据完整性: ${Object.values(user.data_completeness).filter(Boolean).length}/4`)
        
        if (user.login_logs.length > 0) {
          console.log(`   最近登录记录:`)
          user.login_logs.slice(0, 3).forEach(log => {
            console.log(`     - ${new Date(log.login_at).toLocaleString('zh-CN')} ${log.success ? '✓' : '✗'}`)
          })
        }
      })
      
    } catch (error) {
      console.error('显示用户详情失败:', error)
    }
  }
  
  // 导出用户数据为CSV格式
  static async exportUserData() {
    try {
      const users = await this.getAllUsers()
      
      // CSV头部
      let csv = '用户邮箱,注册时间,最后登录,显示名称,任务总数,已完成,已逾期,完成率,数据完整性\n'
      
      users.forEach(user => {
        const row = [
          user.email,
          new Date(user.created_at).toISOString(),
          user.last_sign_in ? new Date(user.last_sign_in).toISOString() : '',
          user.profile.display_name || '',
          user.todos_count,
          user.completed_todos,
          user.overdue_todos,
          user.todos_count > 0 ? ((user.completed_todos / user.todos_count) * 100).toFixed(1) : 0,
          Object.values(user.data_completeness).filter(Boolean).length
        ].map(field => `"${field}"`).join(',')
        
        csv += row + '\n'
      })
      
      return csv
      
    } catch (error) {
      console.error('导出用户数据失败:', error)
      throw error
    }
  }
}

// 使用示例
async function main() {
  try {
    console.log('开始用户数据管理...\n')
    
    // 显示统计信息
    await UserDataManager.showUserStatistics()
    
    // 显示所有用户详情
    await UserDataManager.showUserDetails()
    
    // 导出数据
    const csvData = await UserDataManager.exportUserData()
    console.log('\n=== CSV数据导出完成 ===')
    console.log('数据已准备好导出，可以使用以下代码保存到文件:')
    console.log('```javascript')
    console.log('const fs = require(\'fs\');')
    console.log('fs.writeFileSync(\'user-data.csv\', csvData);')
    console.log('```')
    
  } catch (error) {
    console.error('执行失败:', error)
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default UserDataManager