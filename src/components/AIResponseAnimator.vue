<!--
AI响应动画组件
用于在AI任务操作后提供即时视觉反馈
-->
<template>
  <div v-if="showAnimation" class="ai-response-animator">
    <!-- 成功动画 -->
    <div v-if="animationType === 'success'" class="animation success">
      <div class="animation-icon">✅</div>
      <div class="animation-text">{{ animationMessage }}</div>
    </div>
    
    <!-- 警告动画 -->
    <div v-if="animationType === 'warning'" class="animation warning">
      <div class="animation-icon">⚠️</div>
      <div class="animation-text">{{ animationMessage }}</div>
    </div>
    
    <!-- 错误动画 -->
    <div v-if="animationType === 'error'" class="animation error">
      <div class="animation-icon">❌</div>
      <div class="animation-text">{{ animationMessage }}</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { eventBus, EVENT_TYPES } from '../utils/eventBus.js'

export default {
  name: 'AIResponseAnimator',
  setup() {
    const showAnimation = ref(false)
    const animationType = ref('success')
    const animationMessage = ref('')
    
    // 显示动画
    const show = (type, message, duration = 2000) => {
      animationType.value = type
      animationMessage.value = message
      showAnimation.value = true
      
      // 自动隐藏
      setTimeout(() => {
        showAnimation.value = false
      }, duration)
    }
    
    // 事件监听器
    const handleAIResponse = (eventData) => {
      if (eventData.action === 'create' || eventData.action === 'ai_response') {
        show('success', 'AI任务处理完成!')
      }
    }
    
    const handleTaskCreated = (eventData) => {
      if (eventData.source === 'ai') {
        show('success', `任务创建成功: ${eventData.task.title}`)
      }
    }
    
    const handleTaskUpdated = (eventData) => {
      if (eventData.source === 'ai') {
        show('success', `任务更新成功: ${eventData.newTask.title}`)
      }
    }
    
    const handleTaskDeleted = (eventData) => {
      if (eventData.source === 'ai') {
        show('warning', `任务已删除: ${eventData.taskTitle}`)
      }
    }
    
    const handleTaskToggled = (eventData) => {
      if (eventData.source === 'ai') {
        const status = eventData.completed ? '已完成' : '待办'
        show('success', `任务状态已更新: ${status}`)
      }
    }
    
    const handleError = (eventData) => {
      show('error', `操作失败: ${eventData.error.message}`)
    }
    
    // 设置事件监听器
    const setupEventListeners = () => {
      eventBus.on(EVENT_TYPES.AI_TASK_PROCESSED, handleAIResponse)
      eventBus.on(EVENT_TYPES.TASK_CREATED, handleTaskCreated)
      eventBus.on(EVENT_TYPES.TASK_UPDATED, handleTaskUpdated)
      eventBus.on(EVENT_TYPES.TASK_DELETED, handleTaskDeleted)
      eventBus.on(EVENT_TYPES.TASK_TOGGLED, handleTaskToggled)
      eventBus.on(EVENT_TYPES.ERROR_OCCURRED, handleError)
    }
    
    // 清理事件监听器
    const cleanupEventListeners = () => {
      eventBus.off(EVENT_TYPES.AI_TASK_PROCESSED, handleAIResponse)
      eventBus.off(EVENT_TYPES.TASK_CREATED, handleTaskCreated)
      eventBus.off(EVENT_TYPES.TASK_UPDATED, handleTaskUpdated)
      eventBus.off(EVENT_TYPES.TASK_DELETED, handleTaskDeleted)
      eventBus.off(EVENT_TYPES.TASK_TOGGLED, handleTaskToggled)
      eventBus.off(EVENT_TYPES.ERROR_OCCURRED, handleError)
    }
    
    onMounted(() => {
      setupEventListeners()
    })
    
    onUnmounted(() => {
      cleanupEventListeners()
    })
    
    return {
      showAnimation,
      animationType,
      animationMessage,
      show
    }
  }
}
</script>

<style scoped>
.ai-response-animator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.animation {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 1.7s forwards;
  max-width: 300px;
  background: white;
  border-left: 4px solid;
}

.animation.success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.animation.warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.animation.error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.animation-icon {
  font-size: 20px;
  margin-right: 10px;
  flex-shrink: 0;
}

.animation-text {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: #374151;
}

/* 入场动画 */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 出场动画 */
@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .ai-response-animator {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .animation {
    max-width: none;
    margin: 0;
  }
}

/* 无障碍优化 */
@media (prefers-reduced-motion: reduce) {
  .animation {
    animation: none;
  }
}
</style>