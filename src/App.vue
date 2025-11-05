<template>
  <div id="app">
    <router-view />
    <AIChatButton />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import AIChatButton from './components/AIChatButton.vue'

export default {
  name: 'App',
  components: {
    AIChatButton
  },
  setup() {
    onMounted(() => {
      // 确保页面使用白色主题
      document.documentElement.classList.remove('dark')
    })
    
    return {}
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
</style>