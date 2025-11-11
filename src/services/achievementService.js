/**
 * 成就系统服务
 * 提供轻量级的成就数据管理和业务逻辑
 */

import { ref, reactive } from 'vue'
import { supabase } from '../config/supabase.js'
import dayjs from 'dayjs'

// 成就定义
const achievementDefinitions = [
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
]

// 成就状态管理
const achievements = ref([])
const isLoading = ref(false)
const error = ref(null)

/**
 * 获取用户成就列表
 */
export const useAchievements = () => {
  const loadAchievements = async (userId) => {
    if (!userId) return
    
    isLoading.value = true
    try {
      // 这里可以集成真实数据库
      // 暂时使用模拟数据
      achievements.value = achievementDefinitions
      error.value = null
    } catch (err) {
      console.error('加载成就失败:', err)
      error.value = '加载成就数据失败'
      achievements.value = achievementDefinitions // 出错时使用模拟数据
    } finally {
      isLoading.value = false
    }
  }

  const unlockAchievement = async (achievementId, userId) => {
    try {
      // 更新本地状态
      const achievement = achievements.value.find(a => a.id === achievementId)
      if (achievement) {
        achievement.unlocked = true
        achievement.unlockedAt = dayjs().format('YYYY-MM-DD')
        achievement.progress = 100
      }

      // 这里可以存储到数据库
      // 暂时只更新本地状态
      
      return true
    } catch (err) {
      console.error('解锁成就失败:', err)
      return false
    }
  }

  const checkProgress = async (userId, activityType, activityData) => {
    // 根据用户活动自动检查成就进度
    // 这里可以实现各种成就的自动检查逻辑
    console.log('检查成就进度:', activityType, activityData)
  }

  // 计算统计信息
  const stats = {
    unlockedCount: () => achievements.value.filter(a => a.unlocked).length,
    totalAchievements: () => achievements.value.length,
    completionRate: () => {
      const unlocked = achievements.value.filter(a => a.unlocked).length
      const total = achievements.value.length
      return total > 0 ? Math.round((unlocked / total) * 100) : 0
    }
  }

  return {
    achievements,
    isLoading,
    error,
    loadAchievements,
    unlockAchievement,
    checkProgress,
    stats
  }
}

/**
 * 成就分类管理
 */
export const useAchievementCategories = () => {
  const categories = reactive([
    { label: '全部', value: 'all', count: 0 },
    { label: '任务管理', value: 'task', count: 0 },
    { label: '时间管理', value: 'time', count: 0 },
    { label: '学习成长', value: 'learning', count: 0 },
    { label: '坚持习惯', value: 'habit', count: 0 },
    { label: '个人成就', value: 'personal', count: 0 }
  ])

  const updateCategoryCounts = (achievementsList) => {
    // 更新每个分类的成就数量
    categories.forEach(category => {
      if (category.value === 'all') {
        category.count = achievementsList.length
      } else {
        category.count = achievementsList.filter(a => a.category === category.label).length
      }
    })
  }

  return {
    categories,
    updateCategoryCounts
  }
}

/**
 * 成就通知服务
 */
export const useAchievementNotification = () => {
  const showNotification = (achievement) => {
    // 创建成就解锁通知
    const notification = {
      id: Date.now(),
      type: 'achievement',
      title: `成就解锁: ${achievement.title}`,
      message: achievement.description,
      icon: achievement.icon,
      timestamp: new Date().toISOString()
    }

    // 触发全局通知事件
    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: notification
    }))

    // 在控制台显示（开发调试）
    console.log(`🎉 成就解锁: ${achievement.title}`)
    
    return notification
  }

  return {
    showNotification
  }
}

export default {
  useAchievements,
  useAchievementCategories,
  useAchievementNotification
}