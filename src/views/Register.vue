<template>
  <div class="register-container">
    <div class="register-card">
      <h1>注册账户</h1>
      <p class="subtitle">创建您的智能待办账户</p>
      
      <form @submit.prevent="handleRegister" class="register-form">
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
            minlength="6"
          >
        </div>
        <div class="input-group">
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="确认密码" 
            required
            minlength="6"
          >
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <button type="submit" class="register-btn" :disabled="isLoading">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
        
        <div class="login-link">
          <p>已有账户？ <router-link to="/login">立即登录</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { AuthService } from '../config/storage.js'

export default {
  name: 'Register',
  data() {
    return {
      form: {
        email: '',
        password: '',
        confirmPassword: ''
      },
      isLoading: false,
      errorMessage: ''
    }
  },
  methods: {
    async handleRegister() {
      // 验证表单
      if (!this.form.email || !this.form.password || !this.form.confirmPassword) {
        this.errorMessage = '请填写所有字段'
        return
      }
      
      if (this.form.password !== this.form.confirmPassword) {
        this.errorMessage = '两次输入的密码不一致'
        return
      }
      
      if (this.form.password.length < 6) {
        this.errorMessage = '密码长度至少6位'
        return
      }

      this.isLoading = true
      this.errorMessage = ''

      try {
        await AuthService.signUp(this.form.email, this.form.password)
        this.$router.push('/todos')
      } catch (error) {
        this.errorMessage = error.message || '注册失败，请重试'
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
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

.register-btn {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 20px;
}

.register-btn:hover:not(:disabled) {
  background: #0da271;
}

.register-btn:disabled {
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

.login-link {
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>