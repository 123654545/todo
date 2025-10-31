// 测试Supabase数据库认证
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lfjzcmxtmojzybmwrfhf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmanpjbXh0bW9qenlibXdyZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDk4NDEsImV4cCI6MjA3NjQ4NTg0MX0.d9e5k_OnBkfLdv7KufswZujh1N4B_Om98lU9S43iuwk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDBAuth() {
  console.log('测试Supabase数据库认证...')
  
  try {
    // 测试注册
    console.log('1. 测试用户注册...')
    const signUpResult = await supabase.auth.signUp({
      email: 'testuser@example.com',
      password: 'testpassword123'
    })
    
    if (signUpResult.error) {
      console.error('注册失败:', signUpResult.error.message)
      console.log('错误详情:', signUpResult.error)
      return false
    }
    
    console.log('注册成功:', signUpResult.data)
    
    // 测试登录
    console.log('2. 测试用户登录...')
    const signInResult = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'testpassword123'
    })
    
    if (signInResult.error) {
      console.error('登录失败:', signInResult.error.message)
      return false
    }
    
    console.log('登录成功:', signInResult.data)
    
    // 测试创建任务
    console.log('3. 测试创建任务...')
    const todoResult = await supabase
      .from('todos')
      .insert([{
        title: '测试任务',
        user_id: signInResult.data.user.id,
        completed: false
      }])
      .select()
    
    if (todoResult.error) {
      console.error('创建任务失败:', todoResult.error.message)
      return false
    }
    
    console.log('创建任务成功:', todoResult.data)
    
    return true
    
  } catch (error) {
    console.error('认证测试失败:', error)
    return false
  }
}

testDBAuth().then(success => {
  console.log('测试结果:', success ? '✅ 数据库认证正常' : '❌ 数据库认证失败')
})