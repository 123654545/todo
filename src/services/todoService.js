import { supabase } from '../config/supabase.js'

// 用户认证服务
export class AuthService {
  static async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static getCurrentUser() {
    return supabase.auth.getUser()
  }

  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 待办事项服务
export class TodoService {
  static async getTodos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createTodo(todoData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')
    
    const { data, error } = await supabase
      .from('todos')
      .insert([{
        ...todoData,
        user_id: user.id
      }])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async updateTodo(id, updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')
    
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // 确保用户只能修改自己的任务
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deleteTodo(id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')
    
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // 确保用户只能删除自己的任务
    
    if (error) throw error
  }

  static async toggleTodo(id, completed) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')
    
    const { data, error } = await supabase
      .from('todos')
      .update({ 
        completed, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
    
    if (error) throw error
    return data[0]
  }
}

// 提醒服务
export class ReminderService {
  static async createReminder(reminderData) {
    const { data, error } = await supabase
      .from('reminders')
      .insert([reminderData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async getPendingReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, todos(*)')
      .eq('sent', false)
      .lt('remind_at', new Date().toISOString())
    
    if (error) throw error
    return data
  }
}