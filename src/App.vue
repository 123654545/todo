<template>
  <div id="app">
    <router-view />
    <AIChatButton v-if="isAuthenticated" />
  </div>
</template>

<script>
import { onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AIChatButton from './components/AIChatButton.vue'
import { AuthService } from './config/storage.js'

export default {
  name: 'App',
  components: {
    AIChatButton
  },
  setup() {
    const router = useRouter()
    const isAuthenticated = ref(false)

    // 检查认证状态
    const checkAuthStatus = async () => {
      try {
        const { data: { user } } = await AuthService.getCurrentUser()
        isAuthenticated.value = !!user
      } catch (error) {
        isAuthenticated.value = false
      }
    }

    // 监听路由变化，更新认证状态
    const updateAuthStatus = () => {
      const currentPath = router.currentRoute.value.path
      const isAuthPage = currentPath === '/login' || currentPath === '/register'
      
      // 如果是登录/注册页面，确保隐藏AI按钮
      if (isAuthPage) {
        isAuthenticated.value = false
      } else {
        checkAuthStatus()
      }
    }

    onMounted(() => {
      // 初始检查认证状态
      checkAuthStatus()
      
      // 监听路由变化
      router.afterEach(updateAuthStatus)
    })

    onUnmounted(() => {
      // 清理路由监听器
      router.afterEach(() => {})
    })
    
    return {
      isAuthenticated
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  background-color: #ffffff;
  color: #333333;
}

/* 全局主题变量 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e2e8f0;
  --accent-color: #667eea;
  --card-bg: #ffffff;
  --header-bg: #ffffff;
  --input-bg: #ffffff;
}

/* 应用主题变量 */
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* 应用主题变量 */
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>