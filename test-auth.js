// 测试Supabase认证功能
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lfjzcmxtmojzybmwrfhf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmanpjbXh0bW9qenlibXdyZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDk4NDEsImV4cCI6MjA3NjQ4NTg0MX0.d9e5k_OnBkfLdv7KufswZujh1N4B_Om98lU9S43iuwk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('测试Supabase认证...')
  
  try {
    // 测试注册
    console.log('1. 测试用户注册...')
    const signUpResult = await supabase.auth.signUp({
      email: 'test@gmail.com',
      password: 'testpassword123'
    })
    
    if (signUpResult.error) {
      console.error('注册失败:', signUpResult.error.message)
      console.log('错误详情:', signUpResult.error)
      return
    }
    
    console.log('注册成功:', signUpResult.data)
    
    // 测试登录
    console.log('2. 测试用户登录...')
    const signInResult = await supabase.auth.signInWithPassword({
      email: 'test@gmail.com',
      password: 'testpassword123'
    })
    
    if (signInResult.error) {
      console.error('登录失败:', signInResult.error.message)
      return
    }
    
    console.log('登录成功:', signInResult.data)
    
    // 测试获取当前用户
    console.log('3. 测试获取当前用户...')
    const userResult = await supabase.auth.getUser()
    console.log('当前用户:', userResult.data.user)
    
  } catch (error) {
    console.error('认证测试失败:', error)
  }
}

testAuth()