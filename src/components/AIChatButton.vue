<template>
  <div 
    class="ai-chat-container"
    :style="{ 
      right: buttonPosition.right + 'px', 
      bottom: buttonPosition.bottom + 'px' 
    }"
  >
    <!-- 悬浮按钮 -->
    <button 
      class="ai-chat-button"
      :class="{ 
        active: isOpen,
        dragging: isDragging
      }"
      @click="handleButtonClick"
      @mousedown="startDrag"
      @touchstart="startDrag"
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

      <!-- 快速指令区域 -->
      <div v-if="showQuickActions && messages.length <= 2" class="quick-actions-area">
        <div class="quick-actions">
          <button 
            v-for="(action, index) in quickActions" 
            :key="index"
            class="quick-action-btn"
            @click="useQuickAction(action.text)"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-text">{{ action.text }}</span>
          </button>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-container">
          <input
            v-model="inputText"
            type="text"
            placeholder="试试：添加任务、查看任务、任务统计..."
            class="chat-input"
            @keyup.enter="sendMessage"
            @input="handleInputChange"
          />
          <button class="send-button" @click="sendMessage">
            <span class="send-icon">📤</span>
          </button>
        </div>
        <!-- 智能提示 -->
        <div v-if="inputSuggestions.length > 0 && inputText.trim()" class="suggestions">
          <div 
            v-for="suggestion in inputSuggestions" 
            :key="suggestion"
            class="suggestion-item"
            @click="useSuggestion(suggestion)"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { deepSeekService } from '../services/deepseekService.js'
import { EventEmitter } from '../utils/eventBus.js'

export default {
  name: 'AIChatButton',
  setup() {
    const isOpen = ref(false)
    const inputText = ref('')
    const messages = ref([
      {
        type: 'ai',
        text: `🤖 **AI任务助手 - 快速开始**

试试这些常用指令：
✅ "明天上午9点开会" - 创建任务
✅ "显示今天任务" - 查看任务
✅ "删除会议" - 删除任务
✅ "任务统计" - 查看进度

💡 **提示**：点击下方指令卡片快速体验`,
        time: dayjs().format('HH:mm')
      }
    ])
    
    // 快速指令状态
    const showQuickActions = ref(true)
    const quickActions = ref([
      { text: '明天上午9点开会', icon: '➕' },
      { text: '显示今天任务', icon: '👀' },
      { text: '任务统计', icon: '📊' }
    ])
    
    // 屏幕边界检测（用于对话框位置计算）
    const screenBounds = ref({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    })

    // 拖拽移动相关状态
    const isDragging = ref(false)
    const dragStartPos = ref({ x: 0, y: 0 })
    const buttonPosition = ref({ 
      right: 20, 
      bottom: 180 
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

    // 拖拽功能
    const startDrag = (event) => {
      // 阻止默认行为，避免文本选择
      event.preventDefault()
      
      // 如果是点击事件且不是长按，则不触发拖拽
      if (event.type === 'mousedown' && event.button !== 0) return
      
      // 设置拖拽状态
      isDragging.value = true
      
      // 记录起始位置
      const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
      const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY
      
      dragStartPos.value = {
        x: clientX,
        y: clientY
      }

      // 添加全局事件监听器
      if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', onDrag)
        window.addEventListener('mouseup', stopDrag)
        window.addEventListener('touchmove', onDrag)
        window.addEventListener('touchend', stopDrag)
      }
    }

    const onDrag = (event) => {
      if (!isDragging.value) return
      
      event.preventDefault()
      
      const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
      const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY
      
      // 计算移动距离
      const deltaX = dragStartPos.value.x - clientX
      const deltaY = dragStartPos.value.y - clientY
      
      // 更新按钮位置
      buttonPosition.value.right += deltaX
      buttonPosition.value.bottom += deltaY
      
      // 限制在屏幕边界内
      buttonPosition.value.right = Math.max(10, Math.min(window.innerWidth - 70, buttonPosition.value.right))
      buttonPosition.value.bottom = Math.max(10, Math.min(window.innerHeight - 70, buttonPosition.value.bottom))
      
      // 更新起始位置
      dragStartPos.value = { x: clientX, y: clientY }
    }

    const stopDrag = () => {
      if (!isDragging.value) return
      
      isDragging.value = false
      
      // 移除全局事件监听器
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', onDrag)
        window.removeEventListener('mouseup', stopDrag)
        window.removeEventListener('touchmove', onDrag)
        window.removeEventListener('touchend', stopDrag)
      }
    }

    // 按钮点击处理
    const handleButtonClick = (event) => {
      // 如果正在拖拽，不触发点击事件
      if (isDragging.value) return
      toggleChat()
    }

    const toggleChat = () => {
      isOpen.value = !isOpen.value
    }

    const closeChat = () => {
      isOpen.value = false
    }

    // 快速指令处理
    const useQuickAction = (command) => {
      inputText.value = command
      sendMessage()
      showQuickActions.value = false
    }

    // 输入建议
    const inputSuggestions = ref([])
    
    // 智能提示映射
    const suggestionMap = {
      '添': ['添加任务：明天开会', '添加提醒：晚上学习'],
      '查': ['查看今天任务', '查看待办任务', '查看所有任务'],
      '删': ['删除会议', '删除已完成任务'],
      '任': ['任务统计', '任务进度'],
      '明': ['明天上午9点开会', '明天下午健身'],
      '今': ['今天任务', '今日安排']
    }

    // 处理输入变化
    const handleInputChange = () => {
      const text = inputText.value.trim()
      if (text.length === 0) {
        inputSuggestions.value = []
        return
      }

      // 根据输入内容生成建议
      const suggestions = []
      
      // 关键词匹配
      for (const [key, values] of Object.entries(suggestionMap)) {
        if (text.includes(key)) {
          suggestions.push(...values)
        }
      }

      // 去重并限制数量
      inputSuggestions.value = [...new Set(suggestions)].slice(0, 3)
    }

    // 使用建议
    const useSuggestion = (suggestion) => {
      inputText.value = suggestion
      inputSuggestions.value = []
      // 自动发送
      setTimeout(() => sendMessage(), 100)
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
      showQuickActions,
      quickActions,
      inputSuggestions,
      buttonPosition,
      isDragging,
      handleButtonClick,
      toggleChat,
      closeChat,
      useQuickAction,
      handleInputChange,
      useSuggestion,
      sendMessage,
      startDrag
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

/* 拖拽状态样式 */
.ai-chat-button.dragging {
  cursor: grabbing !important;
  transform: scale(1.15) !important;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.8) !important;
  z-index: 1002 !important;
}

.ai-chat-container:hover .ai-chat-button.dragging {
  transform: scale(1.15) !important;
}

/* 拖拽状态样式 */
.ai-chat-button.dragging {
  cursor: grabbing !important;
  transform: scale(1.15) !important;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.8) !important;
  z-index: 1002 !important;
}

.ai-chat-container:hover .ai-chat-button.dragging {
  transform: scale(1.15) !important;
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

  /* 快速指令区域 */
  .quick-actions-area {
    padding: 8px 12px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: #374151;
  }

  .quick-action-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  .action-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .action-text {
    flex: 1;
    text-align: left;
    font-size: 13px;
    line-height: 1.3;
  }

  /* 智能提示 */
  .suggestions {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px 8px 0 0;
    max-height: 120px;
    overflow-y: auto;
    z-index: 1002;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }

  .suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    color: #374151;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.2s ease;
  }

  .suggestion-item:hover {
    background: #f1f5f9;
  }

  .suggestion-item:last-child {
    border-bottom: none;
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
/* 移动设备 (手机+小屏平板) */
@media (max-width: 768px) {
  .ai-chat-container {
    bottom: 160px; /* 避免遮挡底部导航栏 */
    right: 16px;
  }
  
  .ai-chat-button {
    width: 52px;
    height: 52px;
  }
  
  .ai-chat-dialog {
    width: calc(100vw - 32px);
    height: 45vh;
    bottom: 100%;
    right: 0;
  }
  
  .message-bubble {
    max-width: 85%;
  }
}

/* 平板设备 (中屏设备) */
@media (min-width: 769px) and (max-width: 1024px) {
  .ai-chat-container {
    bottom: 170px;
    right: 24px;
  }
  
  .ai-chat-button {
    width: 56px;
    height: 56px;
  }
  
  .ai-chat-dialog {
    width: 360px;
    height: 420px;
    bottom: 100%;
  }
}

/* 桌面设备 */
@media (min-width: 1025px) {
  .ai-chat-container {
    bottom: 180px;
    right: 32px;
  }
  
  .ai-chat-button {
    width: 60px;
    height: 60px;
  }
  
  .ai-chat-dialog {
    width: 400px;
    height: 450px;
    bottom: 100%;
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
</style>