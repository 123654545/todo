<template>
  <div class="login-container">
    <div class="login-card">
      <h1>智能待办</h1>
      <p class="subtitle">更快记录、更少点击，让任务管理变得零负担</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <input 
            v-model="form.email" 
            type="email" 
            placeholder="邮箱地址" 
            required
          >
        </div>
        <div class="input-group">
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="密码" 
            required
          >
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <button type="submit" class="login-btn" :disabled="isLoading">
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
      
      <div class="register-link">
        <p>没有账户？ <router-link to="/register">立即注册</router-link></p>
      </div>
      

      </form>
    </div>
  </div>
</template>

<script>
import { AuthService } from '../config/storage.js'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      isLoading: false,
      errorMessage: '',
      storageMode: 'database' // 显示当前存储模式
    }
  },
  methods: {
    async handleLogin() {
      if (!this.form.email || !this.form.password) {
        this.errorMessage = '请输入邮箱地址和密码'
        return
      }

      this.isLoading = true
      this.errorMessage = ''

      try {
        // 仅尝试登录
        await AuthService.signIn(this.form.email, this.form.password)
        this.$router.push('/todos')
      } catch (error) {
        this.errorMessage = error.message || '登录失败，请检查邮箱和密码'
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: #1e293b;
  margin-bottom: 8px;
  font-size: 28px;
}

.subtitle {
  text-align: center;
  color: #64748b;
  margin-bottom: 32px;
  font-size: 14px;
}

.input-group {
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  background: #667eea;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.login-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #fef2f2;
  border-radius: 4px;
  border: 1px solid #fecaca;
}
</style>