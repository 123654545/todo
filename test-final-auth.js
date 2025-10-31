// 最终测试Supabase认证
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lfjzcmxtmojzybmwrfhf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmanpjbXh0bW9qenlibXdyZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDk4NDEsImV4cCI6MjA3NjQ4NTg0MX0.d9e5k_OnBkfLdv7KufswZujh1N4B_Om98lU9S43iuwk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFinalAuth() {
  console.log('测试最终Supabase认证配置...')
  
  try {
    // 测试注册
    console.log('1. 测试邮箱注册...')
    const signUpResult = await supabase.auth.signUp({
      email: 'finaltest@example.com',
      password: 'testpassword123'
    })
    
    if (signUpResult.error) {
      console.error('注册失败:', signUpResult.error.message)
      return false
    }
    
    console.log('✅ 注册成功')
    
    // 测试登录
    console.log('2. 测试邮箱登录...')
    const signInResult = await supabase.auth.signInWithPassword({
      email: 'finaltest@example.com',
      password: 'testpassword123'
    })
    
    if (signInResult.error) {
      console.error('登录失败:', signInResult.error.message)
      return false
    }
    
    console.log('✅ 登录成功')
    
    // 测试创建任务
    console.log('3. 测试数据库操作...')
    const todoResult = await supabase
      .from('todos')
      .insert([{
        title: '最终测试任务',
        user_id: signInResult.data.user.id,
        completed: false
      }])
      .select()
    
    if (todoResult.error) {
      console.error('创建任务失败:', todoResult.error.message)
      return false
    }
    
    console.log('✅ 数据库操作成功')
    
    return true
    
  } catch (error) {
    console.error('最终测试失败:', error)
    return false
  }
}

testFinalAuth().then(success => {
  console.log('🎯 最终测试结果:', success ? '✅ 所有功能正常' : '❌ 存在配置问题')
  process.exit(success ? 0 : 1)
})