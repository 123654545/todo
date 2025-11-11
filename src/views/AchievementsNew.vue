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

    <!-- 与编辑资料一致的弹窗样式 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ currentAchievement.icon }} {{ currentAchievement.title }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>💡 核心建议</label>
            <div class="achievement-suggestion">{{ currentAchievement.suggestion }}</div>
          </div>
          
          <div class="form-group">
            <label>🎯 解锁条件</label>
            <div class="achievement-requirement">{{ currentAchievement.requirement }}</div>
          </div>
          
          <div v-if="!currentAchievement.unlocked" class="form-group">
            <label>📊 当前进度</label>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: currentAchievement.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ currentAchievement.progress }}%</span>
            </div>
          </div>
          
          <div v-else class="form-group">
            <label>✅ 状态</label>
            <div class="unlocked-status">
              <span class="unlocked-badge">已解锁</span>
              <span class="unlock-time">解锁时间：{{ formatDate(currentAchievement.unlockedAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button v-if="!currentAchievement.unlocked" class="btn-primary" @click="startAchievementJourney">
            🚀 开始挑战
          </button>
          <button class="btn-secondary" @click="closeModal">关闭</button>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

export default {
  name: 'AchievementsNew',
  setup() {
    const router = useRouter()
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
      }
    ])

    // 计算属性
    const unlockedCount = computed(() => achievements.value.filter(a => a.unlocked).length)
    const totalAchievements = computed(() => achievements.value.length)
    const completionRate = computed(() => Math.round((unlockedCount.value / totalAchievements.value) * 100))
    const filteredAchievements = computed(() => activeCategory.value === '全部' ? achievements.value : achievements.value.filter(a => a.category === activeCategory.value))

    // 方法
    const showAchievementModal = (achievement) => {
      currentAchievement.value = { ...achievement }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      currentAchievement.value = {}
    }

    const startAchievementJourney = () => {
      alert(`开始挑战：${currentAchievement.value.title}\n\n让我们开始吧！继续使用任务管理功能，逐步完成这个成就。`)
      closeModal()
    }

    const formatDate = (dateString) => dateString ? dayjs(dateString).format('YYYY年MM月DD日') : '--'

    // ESC键关闭模态框
    const handleKeydown = (event) => {
      if (event.key === 'Escape' && showModal.value) {
        closeModal()
      }
    }

    // 点击模态框外部关闭
    const handleOverlayClick = (event) => {
      if (event.target.classList.contains('modal-overlay')) {
        closeModal()
      }
    }

    // 添加模态框打开时的动画效果
    const handleModalShow = () => {
      if (showModal.value) {
        // 阻止背景滚动
        document.body.style.overflow = 'hidden'
      }
    }

    // 添加模态框关闭时的清理
    const handleModalClose = () => {
      // 恢复背景滚动
      document.body.style.overflow = ''
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
      // 添加点击事件监听
      document.addEventListener('click', handleOverlayClick)
    })

    // 清理事件监听器
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('click', handleOverlayClick)
      // 确保清理滚动锁定
      document.body.style.overflow = ''
    })

    // 监听模态框状态变化
    watch(showModal, (newVal) => {
      if (newVal) {
        handleModalShow()
      } else {
        handleModalClose()
      }
    })

    return {
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
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.achievement-card.unlocked {
  border-color: #10b981;
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

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
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
  text-align: center;
}

/* 与编辑资料一致的弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.achievement-suggestion, .achievement-requirement {
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #6b7280;
  min-width: 40px;
}

.unlocked-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unlocked-badge {
  background: #10b981;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.unlock-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-secondary {
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* 底部导航 - 统一样式 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  padding: 12px;
  gap: 8px;
  z-index: 1000;
}

.nav-btn {
  flex: 1;
  background: #f1f5f9;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.nav-btn.active {
  background: #667eea;
  color: white;
}

.nav-btn.active {
  color: #667eea;
}

/* 模态弹窗动画 - 优化版本 */
@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 按钮悬停动画 */
.achievement-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-primary-simple, .btn-close-simple {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary-simple:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-close-simple:hover {
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
  }
  
  .modal-simple {
    margin: 0;
    max-height: 90vh;
  }
}
</style>