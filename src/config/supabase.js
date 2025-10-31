import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://lfjzcmxtmojzybmwrfhf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmanpjbXh0bW9qenlibXdyZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDk4NDEsImV4cCI6MjA3NjQ4NTg0MX0.d9e5k_OnBkfLdv7KufswZujh1N4B_Om98lU9S43iuwk'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)