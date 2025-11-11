<template>
  <div 
    class="ai-chat-container"
  >
    <!-- 悬浮按钮 -->
    <button 
      class="ai-chat-button"
      :class="{ 
        active: isOpen
      }"
      @click="handleButtonClick"
    >
      <span class="ai-icon">🤖</span>
    </button>

    <!-- 对话框 -->
    <div 
      v-if="screenBounds && screenBounds.right > 0"
      class="ai-chat-dialog" 
      :class="{ open: isOpen }"
    >
      <!-- 对话框头部 -->
      <div class="chat-header">
        <h3 class="chat-title">AI助手</h3>
        <button class="close-button" @click="closeChat">
          <span class="close-icon">×</span>
        </button>
      </div>

      <!-- 对话内容区域 -->
      <div class="chat-content">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message', message.type, { loading: message.loading, error: message.error }]"
        >
          <div class="message-avatar">
            <span v-if="message.type === 'ai'">🤖</span>
            <span v-else>👤</span>
          </div>
          <div class="message-bubble">
            <p class="message-text">{{ message.text }}</p>
            <span class="message-time">{{ message.time }}</span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-container">
          <input
            v-model="inputText"
            type="text"
            placeholder="请输入您的问题..."
            class="chat-input"
            @keyup.enter="sendMessage"
          />
          <button class="send-button" @click="sendMessage">
            <span class="send-icon">📤</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { deepSeekService } from '../services/deepseekService.js'
import { EventEmitter, EVENT_TYPES } from '../utils/eventBus.js'

export default {
  name: 'AIChatButton',
  setup() {
    const isOpen = ref(false)
    const inputText = ref('')
    const messages = ref([
      {
        type: 'ai',
        text: '您好！我是您的Todo任务管理AI助手。我可以帮助您：创建、编辑和管理任务，设置截止日期和提醒，分类和搜索任务。请只询问与任务管理相关的问题，谢谢！',
        time: dayjs().format('HH:mm')
      }
    ])
    
    // 屏幕边界检测（用于对话框位置计算）
    const screenBounds = ref({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    })

    // 更新屏幕尺寸
    const updateScreenBounds = () => {
      if (typeof window !== 'undefined') {
        screenBounds.value = {
          left: 0,
          right: window.innerWidth,
          top: 0,
          bottom: window.innerHeight
        }
      }
    }

    // 按钮点击处理
    const handleButtonClick = (event) => {
      toggleChat()
    }

    const toggleChat = () => {
      isOpen.value = !isOpen.value
    }

    const closeChat = () => {
      isOpen.value = false
    }

    const sendMessage = async () => {
      if (!inputText.value.trim()) return

      // 添加用户消息
      const userMessage = {
        type: 'user',
        text: inputText.value,
        time: dayjs().format('HH:mm')
      }
      messages.value.push(userMessage)

      // 显示加载状态
      const loadingMessage = {
        type: 'ai',
        text: '正在思考中...',
        time: dayjs().format('HH:mm'),
        loading: true
      }
      messages.value.push(loadingMessage)

      // 保存当前消息内容
      const currentInput = inputText.value
      inputText.value = ''

      try {
        // 调用DeepSeek API
        const aiResponse = await deepSeekService.sendMessage(
          currentInput,
          messages.value.filter(msg => !msg.loading).slice(0, -1) // 排除加载消息
        )

        // 移除加载消息
        messages.value.pop()

        // 添加AI回复
        messages.value.push({
          type: 'ai',
          text: aiResponse,
          time: dayjs().format('HH:mm')
        })

        // 发布AI任务处理事件（用于数据同步）
        EventEmitter.aiTaskProcessed('ai_response', aiResponse, currentInput)

        // 发布AI任务处理事件（用于数据同步）
        EventEmitter.aiTaskProcessed('ai_response', aiResponse, currentInput)

      } catch (error) {
        // 移除加载消息
        messages.value.pop()

        // 添加错误提示
        messages.value.push({
          type: 'ai',
          text: `抱歉，AI服务暂时不可用：${error.message}`,
          time: dayjs().format('HH:mm'),
          error: true
        })
      }

      // 滚动到底部
      setTimeout(() => {
        const chatContent = document.querySelector('.chat-content')
        if (chatContent) {
          chatContent.scrollTop = chatContent.scrollHeight
        }
      }, 100)
    }

    // 生命周期
    onMounted(() => {
      window.addEventListener('resize', updateScreenBounds)
      updateScreenBounds()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateScreenBounds)
    })

    return {
      isOpen,
      inputText,
      messages,
      screenBounds,
      handleButtonClick,
      toggleChat,
      closeChat,
      sendMessage
    }
  }
}
</script>

<style scoped>
.ai-chat-container {
  position: fixed;
  bottom: 180px; /* 大幅向上移动，彻底避免遮挡底部导航栏 */
  right: 20px;
  z-index: 999;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  width: fit-content;
  height: fit-content;
}

.ai-chat-container:active {
  cursor: pointer;
}

/* 虚化效果 - 不点击时 */
.ai-chat-container:not(:hover):not(.active) .ai-chat-button {
  opacity: 0.7;
  filter: blur(1px);
  transform: scale(0.95);
}

/* 悬停时恢复正常 */
.ai-chat-container:hover .ai-chat-button {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

/* 悬浮按钮样式 */
.ai-chat-button {
  width: 56px; /* 稍微减小按钮尺寸，增加间距感 */
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1001;
}

.ai-chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

.ai-chat-button.active {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: rotate(90deg);
}

.ai-icon {
  font-size: 22px; /* 相应调整图标大小 */
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}



/* 对话框样式 - 重新设计为与按钮整体移动 */
.ai-chat-dialog {
  position: absolute;
  bottom: 100%; /* 对话框在按钮的上方 */
  right: 0;
  width: 350px;
  height: 450px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1001;
  pointer-events: none;
}

.ai-chat-dialog.open {
  transform: translateY(-10px);
  opacity: 1;
  pointer-events: auto;
}

/* 对话框头部 */
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chat-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-icon {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

/* 对话内容区域 */
.chat-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8fafc;
}

.message {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  margin: 0 8px;
}

.message.user .message-avatar {
  background: #667eea;
  color: white;
}

.message-bubble {
  max-width: 70%;
  background: white;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.message.user .message-bubble {
  background: #667eea;
  color: white;
}

.message-text {
  margin: 0 0 4px 0;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  display: block;
  text-align: right;
}

/* 输入区域 */
.chat-input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  border-color: #667eea;
}

.send-button {
  background: #667eea;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.send-button:hover {
  background: #5a6fd8;
}

.send-icon {
  font-size: 16px;
}

/* 响应式设计 */
/* 小屏幕手机 */
@media (max-width: 480px) {
  .ai-chat-container {
    bottom: 160px; /* 大幅向上移动，彻底避免遮挡底部导航栏 */
    right: 16px;
  }
  
  .ai-chat-button {
    width: 52px;
    height: 52px;
  }
  
  .ai-chat-dialog {
    width: calc(100vw - 32px);
    height: 45vh; /* 进一步减小高度，确保完全在屏幕内 */
    bottom: 100%; /* 对话框在按钮的上方 */
    right: 0;
    left: auto;
  }
  
  .message-bubble {
    max-width: 85%;
  }
}

/* 平板设备 */
@media (min-width: 481px) and (max-width: 768px) {
  .ai-chat-container {
    bottom: 170px; /* 大幅向上移动，彻底避免遮挡底部导航栏 */
    right: 24px;
  }
  
  .ai-chat-button {
    width: 58px;
    height: 58px;
  }
  
  .ai-chat-dialog {
    width: 320px;
    height: 400px; /* 减小高度，确保完全在屏幕内 */
    bottom: 100%; /* 对话框在按钮的上方 */
    right: 0;
    left: auto;
  }
}

/* 大屏幕设备（桌面） */
@media (min-width: 769px) {
  .ai-chat-container {
    bottom: 180px; /* 大幅向上移动，彻底避免遮挡底部导航栏 */
    right: 32px;
  }
  
  .ai-chat-button {
    width: 60px;
    height: 60px;
  }
  
  .ai-chat-dialog {
    width: 380px;
    height: 430px; /* 减小高度，确保完全在屏幕内 */
    bottom: 100%; /* 对话框在按钮的上方 */
    right: 0;
    left: auto;
  }
}

/* 超大屏幕设备 */
@media (min-width: 1200px) {
  .ai-chat-container {
    bottom: 190px; /* 大幅向上移动，彻底避免遮挡底部导航栏 */
    right: 40px;
  }
  
  .ai-chat-dialog {
    width: 400px;
    height: 450px; /* 减小高度，确保完全在屏幕内 */
    bottom: 100%; /* 对话框在按钮的上方 */
  }
}

/* 滚动条样式 */
.chat-content::-webkit-scrollbar {
  width: 4px;
}

.chat-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.chat-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.chat-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 加载状态样式 */
.message.loading .message-bubble {
  background: #f8fafc !important;
  color: #64748b !important;
  animation: pulse 2s infinite;
}

.message.loading .message-text {
  font-style: italic;
}

/* 错误状态样式 */
.message.error .message-bubble {
  background: #fef2f2 !important;
  border: 1px solid #fecaca;
  color: #dc2626 !important;
}

.message.error .message-text {
  font-style: italic;
}

/* 加载动画 */
@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

/* 浏览器兼容性优化 */
/* Firefox滚动条兼容 */
.chat-content {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

/* IE兼容性处理 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .ai-chat-container {
    position: absolute;
    bottom: 120px;
    right: 20px;
  }
  
  .ai-chat-button {
    filter: none; /* IE不支持CSS filter */
  }
}

/* 移动端触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .ai-chat-button:hover {
    transform: none;
  }
  
  .ai-chat-button:active {
    transform: scale(0.95);
  }
  
  /* 去除移动端虚化效果，提高性能 */
  .ai-chat-container:not(:hover):not(.active) .ai-chat-button {
    opacity: 1;
    filter: none;
    transform: none;
  }
}

/* 浏览器兼容性优化 */
/* Firefox滚动条兼容 */
.chat-content {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

/* IE兼容性处理 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .ai-chat-container {
    position: absolute;
    bottom: 120px;
    right: 20px;
  }
  
  .ai-chat-button {
    filter: none; /* IE不支持CSS filter */
  }
}

/* 移动端触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .ai-chat-button:hover {
    transform: none;
  }
  
  .ai-chat-button:active {
    transform: scale(0.95);
  }
  
  /* 去除移动端虚化效果，提高性能 */
  .ai-chat-container:not(:hover):not(.active) .ai-chat-button {
    opacity: 1;
    filter: none;
    transform: none;
  }
}
</style>