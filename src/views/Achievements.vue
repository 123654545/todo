<template>
  <div class="achievements-container">
    <!-- 页面头部 -->
    <div class="achievements-header">
      <h1>🎯 成就系统</h1>
      <p>完成特定目标解锁成就，提升你的任务管理能力</p>
    </div>

    <!-- 成就统计 -->
    <div class="achievements-stats">
      <div class="stat-item">
        <span class="stat-number">{{ unlockedCount }}</span>
        <span class="stat-label">已解锁</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ totalAchievements }}</span>
        <span class="stat-label">总成就</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ completionRate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
    </div>

    <!-- 成就分类 -->
    <div class="achievements-categories">
      <button 
        v-for="category in categories" 
        :key="category"
        :class="['category-btn', { active: activeCategory === category }]"
        @click="activeCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <!-- 成就网格 -->
    <div class="achievements-grid">
      <div 
        v-for="achievement in filteredAchievements" 
        :key="achievement.id"
        :class="['achievement-card', { unlocked: achievement.unlocked, locked: !achievement.unlocked }]"
        @click="showAchievementModal(achievement)"
      >
        <div class="achievement-icon">
          <span>{{ achievement.icon }}</span>
        </div>
        <div class="achievement-content">
          <h3>{{ achievement.title }}</h3>
          <p>{{ achievement.description }}</p>
          <div v-if="achievement.unlocked" class="unlocked-info">
            <span class="unlock-date">{{ formatDate(achievement.unlockedAt) }}</span>
          </div>
          <div v-else class="progress-info">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: achievement.progress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ achievement.progress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态弹窗 -->
    <div 
      v-if="showModal" 
      class="modal-overlay" 
      @click="closeModal"
    >
      <div class="modal-content" @click.stop>
        <!-- 关闭按钮 -->
        <button class="modal-close" @click="closeModal">
          <span>×</span>
        </button>

        <!-- 成就信息 -->
        <div class="modal-header">
          <div class="achievement-icon-large">
            <span>{{ currentAchievement.icon }}</span>
          </div>
          <div class="achievement-titles">
            <h2>{{ currentAchievement.title }}</h2>
            <p class="achievement-subtitle">{{ currentAchievement.subtitle }}</p>
          </div>
        </div>

        <!-- 核心建议 -->
        <div class="modal-body">
          <div class="suggestion-section">
            <h3>💡 核心建议</h3>
            <p class="suggestion-text">{{ currentAchievement.suggestion }}</p>
          </div>

          <!-- 解锁条件 -->
          <div class="requirement-section">
            <h4>🎯 解锁条件</h4>
            <p class="requirement-text">{{ currentAchievement.requirement }}</p>
          </div>

          <!-- 进度信息 -->
          <div v-if="!currentAchievement.unlocked" class="progress-section">
            <div class="progress-stats">
              <span class="progress-label">当前进度：</span>
              <span class="progress-value">{{ currentAchievement.progress }}%</span>
            </div>
            <div class="progress-bar-modal">
              <div 
                class="progress-fill-modal" 
                :style="{ width: currentAchievement.progress + '%' }"
              ></div>
            </div>
          </div>

          <div v-else class="unlocked-section">
            <div class="unlock-badge">
              <span>✅ 已解锁</span>
            </div>
            <p class="unlock-date">解锁时间：{{ formatDate(currentAchievement.unlockedAt) }}</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-actions">
          <button 
            v-if="!currentAchievement.unlocked" 
            class="btn-primary"
            @click="startAchievementJourney"
          >
            🚀 开始挑战
          </button>
          <button class="btn-secondary" @click="closeModal">
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <button 
        :class="['nav-btn', { active: $route.name === 'TodoList' }]"
        @click="$router.push('/todos')"
      >
        📋 列表
      </button>
      <button 
        :class="['nav-btn', { active: $route.name === 'Calendar' }]"
        @click="$router.push('/calendar')"
      >
        📅 日历
      </button>
      <button 
        :class="['nav-btn', { active: $route.name === 'Statistics' }]"
        @click="$router.push('/statistics')"
      >
        📊 统计
      </button>
      <button 
        :class="['nav-btn', { active: $route.name === 'Profile' }]"
        @click="$router.push('/profile')"
      >
        👤 个人
      </button>
    </nav>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../config/storage.js'
import dayjs from 'dayjs'

export default {
  name: 'Achievements',
  setup() {
    const router = useRouter()
    const currentUser = ref(null)
    const activeCategory = ref('全部')
    const showModal = ref(false)
    const currentAchievement = ref({})

    // 成就分类
    const categories = ['全部', '任务管理', '时间管理', '学习成长', '坚持习惯', '个人成就']

    // 模拟成就数据
    const achievements = ref([
      {
        id: 1,
        title: '任务新手',
        subtitle: '完成第一个任务',
        category: '任务管理',
        icon: '📝',
        description: '创建并完成你的第一个任务',
        suggestion: '从简单的任务开始，逐步建立任务管理习惯。每天制定3-5个小任务，完成后给自己小奖励。',
        requirement: '完成1个任务',
        progress: 100,
        unlocked: true,
        unlockedAt: '2024-01-15'
      },
      {
        id: 2,
        title: '时间大师',
        subtitle: '按时完成任务',
        category: '时间管理',
        icon: '⏰',
        description: '连续7天按时完成任务',
        suggestion: '使用番茄工作法，每25分钟专注工作，5分钟休息。提前规划时间，避免任务堆积。',
        requirement: '连续7天按时完成任务',
        progress: 57,
        unlocked: false,
        unlockedAt: null
      },
      {
        id: 3,
        title: '学习达人',
        subtitle: '坚持学习21天',
        category: '学习成长',
        icon: '📚',
        description: '连续21天完成学习任务',
        suggestion: '建立固定的学习时间，每天进步一点点。记录学习心得，定期回顾收获。',
        requirement: '连续21天完成学习任务',
        progress: 71,
        unlocked: false,
        unlockedAt: null
      },
      {
        id: 4,
        title: '早起小鸟',
        subtitle: '连续30天早起',
        category: '坚持习惯',
        icon: '🌅',
        description: '连续30天在7点前完成任务',
        suggestion: '调整作息时间，逐步提前起床时间。晚上10点前入睡，保证充足睡眠。',
        requirement: '连续30天在7点前完成任务',
        progress: 43,
        unlocked: false,
        unlockedAt: null
      },
      {
        id: 5,
        title: '效率专家',
        subtitle: '完成100个任务',
        category: '任务管理',
        icon: '⚡',
        description: '累计完成100个任务',
        suggestion: '学会任务优先级排序，先完成重要紧急的任务。定期清理已完成任务，保持列表整洁。',
        requirement: '累计完成100个任务',
        progress: 68,
        unlocked: false,
        unlockedAt: null
      },
      {
        id: 6,
        title: '完美主义者',
        subtitle: '任务完成率100%',
        category: '个人成就',
        icon: '🏆',
        description: '单日任务完成率达到100%',
        suggestion: '合理规划任务数量，确保可以完成。适当留出缓冲时间，应对突发情况。',
        requirement: '单日任务完成率达到100%',
        progress: 25,
        unlocked: false,
        unlockedAt: null
      }
    ])

    // 计算属性
    const unlockedCount = computed(() => {
      return achievements.value.filter(a => a.unlocked).length
    })

    const totalAchievements = computed(() => {
      return achievements.value.length
    })

    const completionRate = computed(() => {
      return Math.round((unlockedCount.value / totalAchievements.value) * 100)
    })

    const filteredAchievements = computed(() => {
      if (activeCategory.value === '全部') {
        return achievements.value
      }
      return achievements.value.filter(a => a.category === activeCategory.value)
    })

    // 方法
    const showAchievementModal = (achievement) => {
      console.log('显示模态弹窗:', achievement.title)
      currentAchievement.value = { ...achievement }
      showModal.value = true
    }

    const closeModal = () => {
      console.log('关闭模态弹窗')
      showModal.value = false
      currentAchievement.value = {}
    }

    // ESC键关闭模态框
    const handleKeydown = (event) => {
      if (event.key === 'Escape' && showModal.value) {
        closeModal()
      }
    }

    const startAchievementJourney = () => {
      alert(`开始挑战：${currentAchievement.value.title}\n\n让我们开始吧！继续使用任务管理功能，逐步完成这个成就。`)
      closeModal()
    }

    const formatDate = (dateString) => {
      if (!dateString) return '--'
      return dayjs(dateString).format('YYYY年MM月DD日')
    }

    const getCurrentUser = async () => {
      try {
        const { data } = await AuthService.getCurrentUser()
        currentUser.value = data.user
        if (!currentUser.value) {
          router.push('/login')
        }
      } catch (error) {
        console.error('获取用户失败:', error)
        router.push('/login')
      }
    }

    onMounted(() => {
      getCurrentUser()
      // 添加键盘事件监听
      window.addEventListener('keydown', handleKeydown)
    })

    // 清理事件监听器
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
    })

    return {
      currentUser,
      activeCategory,
      categories,
      achievements,
      unlockedCount,
      totalAchievements,
      completionRate,
      filteredAchievements,
      showModal,
      currentAchievement,
      showAchievementModal,
      closeModal,
      startAchievementJourney,
      formatDate
    }
  }
}
</script>

<style scoped>
.achievements-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 140px);
  padding-bottom: 80px;
}

/* 页面头部 */
.achievements-header {
  text-align: center;
  margin-bottom: 32px;
}

.achievements-header h1 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 8px;
  font-weight: 700;
}

.achievements-header p {
  color: #64748b;
  font-size: 1rem;
}

/* 成就统计 */
.achievements-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
}

/* 分类按钮 */
.achievements-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #64748b;
  transition: all 0.3s ease;
}

.category-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.category-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* 成就网格 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.achievement-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.achievement-card.unlocked {
  border-color: #10b981;
}

.achievement-card.locked {
  opacity: 0.8;
}

.achievement-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 12px;
}

.achievement-content h3 {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 8px;
  font-weight: 600;
}

.achievement-content p {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 16px;
  line-height: 1.4;
}

.unlocked-info {
  text-align: center;
}

.unlock-date {
  font-size: 0.8rem;
  color: #10b981;
  font-weight: 500;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #64748b;
  min-width: 40px;
  text-align: right;
}

/* 模态弹窗 - 简化版本 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #374151;
}

.modal-header {
  padding: 32px 32px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.achievement-icon-large {
  font-size: 3rem;
}

.achievement-titles h2 {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
  font-weight: 700;
}

.achievement-subtitle {
  color: #667eea;
  font-size: 1rem;
  margin: 4px 0 0 0;
  font-weight: 500;
}

.modal-body {
  padding: 24px 32px;
}

.suggestion-section {
  margin-bottom: 24px;
}

.suggestion-section h3 {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 12px;
  font-weight: 600;
}

.suggestion-text {
  color: #64748b;
  line-height: 1.6;
  font-size: 0.95rem;
}

.requirement-section {
  margin-bottom: 24px;
}

.requirement-section h4 {
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 8px;
  font-weight: 600;
}

.requirement-text {
  color: #64748b;
  font-size: 0.9rem;
}

.progress-section,
.unlocked-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  color: #64748b;
  font-size: 0.9rem;
}

.progress-value {
  color: #667eea;
  font-weight: 600;
  font-size: 0.9rem;
}

.progress-bar-modal {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-modal {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.unlock-badge {
  background: #10b981;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 8px;
}

.unlock-date {
  color: #64748b;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px 32px;
  border-top: 1px solid #f1f5f9;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* 底部导航 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  padding: 8px;
  z-index: 1000;
}

.nav-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #64748b;
  transition: all 0.3s ease;
}

.nav-btn.active {
  color: #667eea;
}

.nav-btn:hover {
  color: #667eea;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 成就卡片悬停动画 */
.achievement-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

/* 按钮悬停动画 */
.btn-primary, .btn-secondary {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .achievements-container {
    padding: 12px;
    padding-bottom: 80px;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .achievements-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-item {
    padding: 16px;
  }

  .achievements-categories {
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .modal-content {
    margin: 0;
    max-height: 95vh;
  }

  .modal-header {
    padding: 24px 24px 20px;
  }

  .modal-body {
    padding: 20px 24px;
  }

  .modal-actions {
    padding: 20px 24px;
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .achievements-header h1 {
    font-size: 1.5rem;
  }

  .achievements-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .achievement-icon {
    font-size: 2rem;
  }

  .achievement-content h3 {
    font-size: 1rem;
  }
}
</style>