<template>
  <div class="profile-container">
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-avatar" @click="editAvatar" @contextmenu="showAvatarMenu">
        <span class="avatar-icon" v-if="!userProfile?.avatar_url">{{ userInitials }}</span>
        <img 
          v-else
          :src="userProfile.avatar_url" 
          :alt="userProfile?.display_name || currentUser?.email"
          class="avatar-image"
        />
        <div class="avatar-overlay">
          <span class="edit-icon">✏️</span>
        </div>
      </div>
      <div class="user-info">
        <h2>{{ userProfile?.display_name || currentUser?.email }}</h2>
        <p class="user-email">{{ currentUser?.email }}</p>
        <p class="user-role">
          <span :class="['role-badge', userLevel]">{{ userLevelText }}</span>
          <span class="level-progress">
            <span class="progress-bar">
              <span class="progress-fill" :style="{ width: levelProgress + '%' }"></span>
            </span>
            <span class="progress-text">{{ levelProgress }}%</span>
          </span>
        </p>
        <p class="member-since">注册时间: {{ formatDate(currentUser?.created_at) }}</p>
        <p class="last-login" v-if="userProfile?.last_login">
          最后登录: {{ formatDate(userProfile.last_login) }}
        </p>
        <p class="login-count" v-if="userProfile?.login_count">
          登录次数: {{ userProfile.login_count }} 次
        </p>
        <div class="user-actions">
          <button class="action-btn small" @click="editProfile">
            <span class="btn-icon">✏️</span>
            编辑资料
          </button>
          <button class="action-btn small" @click="showAchievements">
            <span class="btn-icon">🏆</span>
            成就
          </button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" @click="showTaskDetails('total')">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>{{ stats.totalTasks }}</h3>
          <p>总任务数</p>
          <div class="stat-trend" v-if="stats.trends.total > 0">
            <span class="trend-up">↗ +{{ stats.trends.total }}</span>
          </div>
        </div>
      </div>
      <div class="stat-card" @click="showTaskDetails('completed')">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3>{{ stats.completedTasks }}</h3>
          <p>已完成</p>
          <div class="stat-trend" v-if="stats.trends.completed > 0">
            <span class="trend-up">↗ +{{ stats.trends.completed }}</span>
          </div>
        </div>
      </div>
      <div class="stat-card" @click="showTaskDetails('overdue')">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <h3>{{ stats.overdueTasks }}</h3>
          <p>已逾期</p>
          <div class="stat-trend" v-if="stats.trends.overdue > 0">
            <span class="trend-down">↘ +{{ stats.trends.overdue }}</span>
          </div>
        </div>
      </div>
      <div class="stat-card clickable" @click="goToStatistics">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <h3>{{ stats.completionRate }}%</h3>
          <p>完成率</p>
          <div class="stat-trend" v-if="stats.trends.rate !== 0">
            <span :class="stats.trends.rate > 0 ? 'trend-up' : 'trend-down'">
              {{ stats.trends.rate > 0 ? '↗' : '↘' }} {{ Math.abs(stats.trends.rate) }}%
            </span>
          </div>
          <div class="click-hint">点击查看详情 →</div>
        </div>
      </div>
    </div>

    <!-- 用户档案编辑弹窗 -->
    <div v-if="showProfileEdit" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content profile-edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑个人资料</h3>
          <button class="close-btn" @click="cancelEdit">×</button>
        </div>
        
        <div class="edit-form">
          <div class="form-group">
            <label>显示名称</label>
            <input 
              v-model="userProfile.display_name" 
              placeholder="请输入显示名称"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label>个人简介</label>
            <textarea 
              v-model="userProfile.bio" 
              placeholder="请输入个人简介"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>手机号码</label>
              <input 
                v-model="userProfile.phone" 
                placeholder="请输入手机号码"
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label>性别</label>
              <select v-model="userProfile.gender" class="form-select">
                <option value="">请选择</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>出生日期</label>
              <input 
                v-model="userProfile.date_of_birth" 
                type="date"
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label>时区</label>
              <select v-model="userProfile.timezone" class="form-select">
                <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
                <option value="America/New_York">纽约时间 (UTC-5)</option>
                <option value="Europe/London">伦敦时间 (UTC+0)</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>国家</label>
              <input 
                v-model="userProfile.country" 
                placeholder="请输入国家"
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label>城市</label>
              <input 
                v-model="userProfile.city" 
                placeholder="请输入城市"
                class="form-input"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label>语言</label>
            <select v-model="userProfile.language" class="form-select">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelEdit" class="btn-secondary">取消</button>
          <button @click="saveUserProfile" class="btn-primary">保存</button>
        </div>
      </div>
    </div>

    <!-- 任务分析面板 -->
    <div class="analytics-section">
      <div class="section-header">
        <h3>任务分析</h3>
        <button class="toggle-btn" @click="toggleAnalytics">
          {{ showAnalytics ? '收起' : '展开' }}
        </button>
      </div>
      <div v-if="showAnalytics" class="analytics-content">
        <div class="analytics-grid">
          <div class="analytics-card">
            <h4>最近活动</h4>
            <div class="recent-activity">
              <div 
                v-for="activity in recentActivities" 
                :key="activity.id"
                class="activity-item"
              >
                <span class="activity-icon">{{ activity.icon }}</span>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.text }}</p>
                  <span class="activity-time">{{ activity.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置区域 -->
    <div class="settings-section">
      <div class="section-header">
        <h3>偏好设置</h3>
        <button class="save-btn" @click="saveAllSettings">保存所有设置</button>
      </div>
      <div class="settings-list">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-icon">🔔</span>
            <div>
              <h4>邮件通知</h4>
              <p>任务提醒和统计报告</p>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.emailNotifications">
            <span class="slider"></span>
          </label>
        </div>
        

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-icon">⚡</span>
            <div>
              <h4>默认优先级</h4>
              <p>新建任务的默认优先级</p>
            </div>
          </div>
          <select v-model="settings.defaultPriority" class="priority-select">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h3>快速操作</h3>
      <div class="action-buttons">
        <button class="action-btn" @click="exportData">
          <span class="action-icon">📤</span>
          导出数据
        </button>
        <button class="action-btn" @click="clearCompleted">
          <span class="action-icon">🗑️</span>
          清理已完成
        </button>
        <button class="action-btn" @click="showHelp">
          <span class="action-icon">❓</span>
          使用帮助
        </button>
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
        :class="['nav-btn', { active: $route.name === 'Profile' }]"
        @click="$router.push('/profile')"
      >
        👤 个人
      </button>
    </nav>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService, TodoService } from '../config/storage.js'
import { supabase } from '../config/supabase.js'
import dayjs from 'dayjs'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
    const currentUser = ref(null)
    const isLoading = ref(true)
    const todos = ref([])
    
    // 用户设置
    const settings = ref({
      emailNotifications: true,
      darkMode: false,
      defaultPriority: 'medium',
      autoSave: true,
      showAnalytics: true
    })
    
    // 用户档案
    const userProfile = ref({
      display_name: '',
      avatar_url: '',
      bio: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      country: '',
      city: '',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      last_login: null,
      login_count: 0
    })
    
    // 统计信息
    const stats = ref({
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      trends: {
        total: 0,
        completed: 0,
        overdue: 0,
        rate: 0
      }
    })
    
    // 交互状态
    const showAnalytics = ref(true)
    const showProfileEdit = ref(false)
    const userLevel = ref('beginner')
    const levelProgress = ref(0)
    const recentActivities = ref([])

    // 获取当前用户
    const getCurrentUser = async () => {
      try {
        const { data } = await AuthService.getCurrentUser()
        currentUser.value = data.user
        if (!currentUser.value) {
          router.push('/login')
          return
        }
        await loadTodos()
        await loadUserSettings()
        await loadUserProfile()
        // calculateStats() 已在 loadTodos() 内部调用，无需重复调用
      } catch (error) {
        console.error('获取用户失败:', error)
        router.push('/login')
      } finally {
        isLoading.value = false
      }
    }
    
    // 加载用户档案
    const loadUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.value.id)
          .limit(1)
        
        if (data && data.length > 0) {
          userProfile.value = {
            display_name: data[0].display_name || '',
            avatar_url: data[0].avatar_url || '',
            bio: data[0].bio || '',
            phone: data[0].phone || '',
            date_of_birth: data[0].date_of_birth || '',
            gender: data[0].gender || '',
            country: data[0].country || '',
            city: data[0].city || '',
            timezone: data[0].timezone || 'Asia/Shanghai',
            language: data[0].language || 'zh-CN',
            last_login: data[0].last_login,
            login_count: data[0].login_count || 0
          }
        } else {
          // 如果没有用户档案，使用默认值
          userProfile.value = {
            display_name: '',
            avatar_url: '',
            bio: '',
            phone: '',
            date_of_birth: '',
            gender: '',
            country: '',
            city: '',
            timezone: 'Asia/Shanghai',
            language: 'zh-CN',
            last_login: null,
            login_count: 0
          }
        }
      } catch (error) {
        console.error('加载用户档案失败:', error)
        // 出错时使用默认值
        userProfile.value = {
          display_name: '',
          avatar_url: '',
          bio: '',
          phone: '',
          date_of_birth: '',
          gender: '',
          country: '',
          city: '',
          timezone: 'Asia/Shanghai',
          language: 'zh-CN',
          last_login: null,
          login_count: 0
        }
      }
    }
    
    // 保存用户档案
    const saveUserProfile = async () => {
      try {
        console.log('开始保存用户档案...')
        console.log('当前用户ID:', currentUser.value?.id)
        console.log('档案数据:', userProfile.value)
        
        // 先检查用户档案是否存在
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', currentUser.value.id)
          .limit(1)
        
        if (checkError) {
          console.error('检查用户档案失败:', checkError)
          throw checkError
        }
        
        console.log('现有档案检查结果:', existingProfile)
        
        // 验证性别字段，确保符合数据库约束
        const validGender = ['male', 'female', 'other', ''].includes(userProfile.value.gender) 
          ? userProfile.value.gender 
          : '';
        
        const profileData = {
          user_id: currentUser.value.id,
          display_name: userProfile.value.display_name || '',
          bio: userProfile.value.bio || '',
          phone: userProfile.value.phone || '',
          date_of_birth: userProfile.value.date_of_birth || null,
          gender: validGender,
          country: userProfile.value.country || '',
          city: userProfile.value.city || '',
          timezone: userProfile.value.timezone || 'Asia/Shanghai',
          language: userProfile.value.language || 'zh-CN',
          updated_at: new Date().toISOString()
        }
        
        console.log('准备保存的档案数据:', profileData)
        
        let result
        if (existingProfile && existingProfile.length > 0) {
          // 更新现有档案
          console.log('执行更新操作...')
          result = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('user_id', currentUser.value.id)
        } else {
          // 插入新档案
          console.log('执行插入操作...')
          result = await supabase
            .from('user_profiles')
            .insert(profileData)
        }
        
        console.log('保存操作结果:', result)
        
        if (result.error) {
          console.error('保存操作详细错误:', result.error)
          throw result.error
        }
        
        console.log('用户档案保存成功!')
        showProfileEdit.value = false
        alert('档案信息已保存！')
      } catch (error) {
        console.error('保存用户档案失败:', error)
        console.error('错误详情:', JSON.stringify(error, null, 2))
        alert('保存失败，请重试')
      }
    }
    
    // 加载任务列表
    const loadTodos = async () => {
      try {
        console.log('开始加载任务数据...')
        const todoData = await TodoService.getTodos()
        console.log('获取到的任务数据:', todoData)
        
        todos.value = todoData.map(todo => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          dueDate: todo.due_date,
          dueTime: todo.due_time,
          priority: todo.priority,
          nluRaw: todo.nlu_raw,
          created_at: todo.created_at,
          updated_at: todo.updated_at,
          isOverdue: todo.due_date && !todo.completed && dayjs(todo.due_date).isBefore(dayjs(), 'day')
        }))
        
        console.log('处理后的任务列表:', todos.value)
        console.log('逾期任务:', todos.value.filter(t => t.isOverdue))
        
        // 数据加载完成后立即计算统计信息
        calculateStats()
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }
    
    // 加载用户设置
    const loadUserSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.value.id)
          .limit(1)
        
        if (data && data.length > 0) {
          settings.value = {
            emailNotifications: data[0].email_notifications,
            darkMode: data[0].theme === 'dark',
            defaultPriority: data[0].default_priority
          }
        } else {
          // 如果没有用户设置，使用默认值
          settings.value = {
            emailNotifications: true,
            darkMode: false,
            defaultPriority: 'medium'
          }
        }
      } catch (error) {
        console.error('加载用户设置失败:', error)
        // 出错时使用默认值
        settings.value = {
          emailNotifications: true,
          darkMode: false,
          defaultPriority: 'medium'
        }
      }
    }
    
    // 计算统计信息
    const calculateStats = () => {
      console.log('开始计算统计信息...')
      console.log('当前任务总数:', todos.value.length)
      
      const total = todos.value.length
      const completed = todos.value.filter(todo => todo.completed).length
      
      // 详细检查逾期计算
      const overdueTasks = todos.value.filter(todo => {
        if (!todo.completed && todo.dueDate) {
          const isOverdue = dayjs(todo.dueDate).isBefore(dayjs(), 'day')
          console.log(`任务"${todo.title}": 完成=${todo.completed}, 截止=${todo.dueDate}, 逾期=${isOverdue}`)
          return isOverdue
        }
        return false
      })
      
      const overdue = overdueTasks.length
      console.log('计算出的逾期任务数量:', overdue)
      
      stats.value = {
        totalTasks: total,
        completedTasks: completed,
        overdueTasks: overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
      
      console.log('最终统计结果:', stats.value)
      
      calculateTrends()
      generateRecentActivities()
      calculateUserLevel() // 计算用户等级和进度
    }
    
    // 用户姓名首字母
    const userInitials = computed(() => {
      if (!currentUser.value?.email) return 'U'
      return currentUser.value.email.charAt(0).toUpperCase()
    })
    
    // 用户等级文本
    const userLevelText = computed(() => {
      const levels = {
        beginner: '初级用户',
        intermediate: '中级用户',
        advanced: '高级用户',
        expert: '专家用户'
      }
      return levels[userLevel.value] || levels['beginner'] || '普通用户'
    })
    
    // 计算用户等级和进度
    const calculateUserLevel = () => {
      if (!userProfile.value || !stats.value) return
      
      const totalTasks = stats.value.totalTasks || 0
      const completedTasks = stats.value.completedTasks || 0
      const loginCount = userProfile.value.login_count || 0
      
      // 计算综合分数（基于任务完成情况和登录频率）
      let score = 0
      
      // 任务完成度权重：40%
      if (totalTasks > 0) {
        score += (completedTasks / totalTasks) * 40
      }
      
      // 任务数量权重：30%
      score += Math.min(totalTasks * 2, 30) // 每完成1个任务得2分，最多30分
      
      // 登录频率权重：30%
      score += Math.min(loginCount * 1.5, 30) // 每次登录得1.5分，最多30分
      
      // 根据分数确定等级
      if (score >= 80) {
        userLevel.value = 'expert'
      } else if (score >= 60) {
        userLevel.value = 'advanced'
      } else if (score >= 30) {
        userLevel.value = 'intermediate'
      } else {
        userLevel.value = 'beginner'
      }
      
      // 计算当前等级内的进度（0-100%）
      const levelThresholds = {
        beginner: 0,
        intermediate: 30,
        advanced: 60,
        expert: 80
      }
      
      const currentThreshold = levelThresholds[userLevel.value]
      const nextThreshold = userLevel.value === 'expert' ? 100 : levelThresholds[Object.keys(levelThresholds)[Object.keys(levelThresholds).indexOf(userLevel.value) + 1]]
      
      if (userLevel.value === 'expert') {
        levelProgress.value = 100 // 专家用户进度为100%
      } else {
        levelProgress.value = Math.round(((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      return dayjs(dateString).format('YYYY年MM月DD日')
    }
    
    // 生成最近活动（基于用户实际任务）
    const generateRecentActivities = () => {
      if (!todos.value || todos.value.length === 0) {
        // 如果没有任务，显示暂无活动
        recentActivities.value = [
          {
            id: 1,
            icon: '📋',
            text: '暂无最近活动',
            time: '--'
          }
        ]
        return
      }
      
      // 获取最近的任务活动（按创建时间和更新时间排序）
      const recentTodos = [...todos.value]
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5) // 只显示最近的5个活动
      
      recentActivities.value = recentTodos.map((todo, index) => {
        const activityTime = new Date(todo.updated_at || todo.created_at)
        const now = new Date()
        const timeDiff = now - activityTime
        
        // 计算相对时间
        let timeText = ''
        if (timeDiff < 60000) { // 1分钟内
          timeText = '刚刚'
        } else if (timeDiff < 3600000) { // 1小时内
          timeText = `${Math.floor(timeDiff / 60000)}分钟前`
        } else if (timeDiff < 86400000) { // 1天内
          timeText = `${Math.floor(timeDiff / 3600000)}小时前`
        } else {
          timeText = `${Math.floor(timeDiff / 86400000)}天前`
        }
        
        // 根据任务状态和操作类型生成活动描述
        let icon = '📝'
        let actionText = ''
        
        if (todo.completed) {
          icon = '✅'
          actionText = '完成了任务'
        } else if (todo.updated_at && todo.updated_at !== todo.created_at) {
          icon = '✏️'
          actionText = '更新了任务'
        } else {
          icon = '📝'
          actionText = '创建了新任务'
        }
        
        return {
          id: todo.id || index + 1,
          icon: icon,
          text: `${actionText}：${todo.title}`,
          time: timeText
        }
      })
    }
    
    // 计算趋势数据
    const calculateTrends = () => {
      // 模拟趋势数据
      stats.value.trends = {
        total: Math.floor(Math.random() * 5),
        completed: Math.floor(Math.random() * 3),
        overdue: Math.floor(Math.random() * 2),
        rate: Math.floor(Math.random() * 10) - 5
      }
    }
    
    // 导出数据
    const exportData = () => {
      const data = {
        user: currentUser.value,
        todos: todos.value,
        stats: stats.value,
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `todo-data-${dayjs().format('YYYY-MM-DD')}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    
    // 清理已完成任务
    const clearCompleted = async () => {
      if (confirm('确定要删除所有已完成的任务吗？此操作不可撤销。')) {
        try {
          const completedTodos = todos.value.filter(todo => todo.completed)
          for (const todo of completedTodos) {
            await TodoService.deleteTodo(todo.id)
          }
          await loadTodos()
          await calculateStats()
          alert('已完成任务清理成功！')
        } catch (error) {
          console.error('清理任务失败:', error)
          alert('清理失败，请重试')
        }
      }
    }
    
    // 显示帮助
    const showHelp = () => {
      const helpText = '智能待办使用帮助：\
\
1. 使用自然语言创建任务，如"明天下午3点开会"\
2. 在日历视图查看任务时间分布\
3. 设置优先级来管理重要任务\
4. 在个人中心查看统计数据和设置偏好'
      alert(helpText)
    }
    
    // 头像编辑功能
    const editAvatar = () => {
      // 创建文件输入元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.style.display = 'none'
      
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        // 检查文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
          alert('图片大小不能超过2MB')
          return
        }
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
          alert('请选择图片文件')
          return
        }
        
        try {
          // 显示加载状态
          const originalText = document.querySelector('.avatar-icon')?.textContent
          if (document.querySelector('.avatar-icon')) {
            document.querySelector('.avatar-icon').textContent = '⏳'
          }
          
          // 创建图片预览
          const reader = new FileReader()
          reader.onload = async (event) => {
            const imageUrl = event.target.result
            
            // 询问用户是否确认上传
            if (confirm('确定要上传这张图片作为头像吗？')) {
              await uploadAvatar(file, imageUrl)
            }
            
            // 恢复原始文本
            if (document.querySelector('.avatar-icon') && originalText) {
              document.querySelector('.avatar-icon').textContent = originalText
            }
          }
          reader.readAsDataURL(file)
          
        } catch (error) {
          console.error('头像上传失败:', error)
          alert('头像上传失败，请重试')
          
          // 恢复原始文本
          if (document.querySelector('.avatar-icon')) {
            document.querySelector('.avatar-icon').textContent = userInitials.value
          }
        }
      }
      
      // 触发文件选择
      document.body.appendChild(input)
      input.click()
      document.body.removeChild(input)
    }
    
    // 上传头像（使用本地存储方案）
    const uploadAvatar = async (file, imageUrl) => {
      try {
        // 将头像数据转换为Base64
        const base64Avatar = await fileToBase64(file)
        
        // 先检查用户档案是否存在
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', currentUser.value.id)
          .limit(1)
        
        if (checkError) throw checkError
        
        // 根据是否存在决定使用更新还是插入
        let updateError
        if (existingProfile && existingProfile.length > 0) {
          // 更新现有档案
          const { error } = await supabase
            .from('user_profiles')
            .update({
              avatar_url: imageUrl,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.value.id)
          updateError = error
        } else {
          // 插入新档案
          const { error } = await supabase
            .from('user_profiles')
            .insert({
              user_id: currentUser.value.id,
              avatar_url: imageUrl,
              updated_at: new Date().toISOString()
            })
          updateError = error
        }
        
        if (updateError) throw updateError
        
        // 更新本地状态
        userProfile.value.avatar_url = imageUrl
        
        alert('头像上传成功！')
        
        // 重新加载用户档案以获取最新数据
        await loadUserProfile()
        
      } catch (error) {
        console.error('头像上传失败:', error)
        alert('头像上传失败，请重试')
        throw error
      }
    }
    
    // 文件转换为Base64
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    }
    
    // 删除头像
    const deleteAvatar = async () => {
      if (!userProfile.value.avatar_url) {
        alert('当前没有设置头像')
        return
      }
      
      if (confirm('确定要删除当前头像吗？')) {
        try {
          // 从用户档案中移除头像数据
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              avatar_url: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.value.id)
          
          if (updateError) throw updateError
          
          // 更新本地状态
          userProfile.value.avatar_url = null

          
          alert('头像删除成功！')
          
          // 重新加载用户档案
          await loadUserProfile()
          
        } catch (error) {
          console.error('头像删除失败:', error)
          alert('头像删除失败，请重试')
        }
      }
    }
    
    // 显示头像操作菜单
    const showAvatarMenu = (event) => {
      event.preventDefault()
      event.stopPropagation()
      
      // 创建菜单元素
      const menu = document.createElement('div')
      menu.className = 'avatar-menu'
      menu.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 120px;
      `
      
      const menuItems = [
        { text: '更换头像', action: editAvatar },
        { text: '查看头像', action: () => viewAvatar() },
        { text: '删除头像', action: deleteAvatar }
      ]
      
      menuItems.forEach(item => {
        const button = document.createElement('button')
        button.textContent = item.text
        button.style.cssText = `
          display: block;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
        `
        button.onmouseenter = () => button.style.background = '#f1f5f9'
        button.onmouseleave = () => button.style.background = 'none'
        button.onclick = (e) => {
          e.stopPropagation()
          item.action()
          document.body.removeChild(menu)
        }
        menu.appendChild(button)
      })
      
      // 添加关闭菜单的功能
      const closeMenu = () => {
        if (menu.parentNode) {
          document.body.removeChild(menu)
        }
        document.removeEventListener('click', closeMenu)
      }
      
      document.body.appendChild(menu)
      document.addEventListener('click', closeMenu)
      
      // 定位菜单
      const avatarElement = event.currentTarget
      const rect = avatarElement.getBoundingClientRect()
      menu.style.top = `${rect.bottom + window.scrollY}px`
      menu.style.left = `${rect.left + window.scrollX}px`
    }
    
    // 查看头像大图
    const viewAvatar = () => {
      if (!userProfile.value.avatar_url) {
        alert('当前没有设置头像')
        return
      }
      
      // 创建模态窗口显示大图
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      `
      
      const image = document.createElement('img')
      image.src = userProfile.value.avatar_url
      image.style.cssText = `
        max-width: 80%;
        max-height: 80%;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      `
      
      const closeModal = () => {
        document.body.removeChild(modal)
      }
      
      modal.onclick = closeModal
      image.onclick = (e) => e.stopPropagation()
      
      modal.appendChild(image)
      document.body.appendChild(modal)
    }
    
    const editProfile = () => {
      showProfileEdit.value = true
    }
    
    // 取消编辑
    const cancelEdit = () => {
      showProfileEdit.value = false
      loadUserProfile() // 重新加载原始数据
    }
    
    const showAchievements = () => {
      alert('成就系统开发中...')
    }
    
    const showTaskDetails = (type) => {
      if (type === 'total') {
        // 跳转到所有任务界面
        router.push('/all-tasks')
      } else if (type === 'completed') {
        // 跳转到已完成任务界面
        router.push('/completed-tasks')
      } else if (type === 'overdue') {
        // 跳转到已逾期任务界面
        router.push('/overdue-tasks')
      } else {
        const messages = {
          rate: '查看完成率分析'
        }
        alert(messages[type] || '查看任务详情')
      }
    }
    
    // 跳转到统计页面
    const goToStatistics = () => {
      router.push('/statistics')
    }
    
    const toggleAnalytics = () => {
      showAnalytics.value = !showAnalytics.value
    }
    
    const saveAllSettings = () => {
      saveSettings()
      alert('所有设置已保存！')
    }
    
    // 保存设置
    const saveSettings = async () => {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: currentUser.value.id,
            email_notifications: settings.value.emailNotifications,
            theme: settings.value.darkMode ? 'dark' : 'light',
            default_priority: settings.value.defaultPriority,
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
        
        // 应用主题
        if (settings.value.darkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        // 发送设置变化事件，通知其他页面更新
        window.dispatchEvent(new CustomEvent('settingsUpdated', {
          detail: {
            defaultPriority: settings.value.defaultPriority,
            darkMode: settings.value.darkMode
          }
        }))
        
      } catch (error) {
        console.error('保存设置失败:', error)
      }
    }
    
    // 监听设置变化
    onMounted(() => {
      // 设置变化时自动保存
      const saveSettingsDebounced = debounce(saveSettings, 1000)
      
      // 监听设置变化
      Object.keys(settings.value).forEach(key => {
        watch(() => settings.value[key], saveSettingsDebounced)
      })
    })
    
    // 防抖函数
    const debounce = (func, wait) => {
      let timeout
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    }

    // 组件挂载时获取用户信息
    onMounted(() => {
      getCurrentUser()
    })

    return {
      currentUser,
      isLoading,
      settings,
      stats,
      userProfile,
      userInitials,
      formatDate,
      exportData,
      clearCompleted,
      showHelp,
      showProfileEdit,
      editProfile,
      cancelEdit,
      saveUserProfile,
      editAvatar,
      showAchievements,
      showTaskDetails,
      goToStatistics,
      toggleAnalytics,
      saveAllSettings,
      showAnalytics,
      userLevel,
      userLevelText,
      levelProgress,
      recentActivities,
      showAvatarMenu,
      deleteAvatar,
      viewAvatar
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 140px);
  padding-bottom: 80px;
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: none;
  filter: none;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.user-avatar:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.3);
}

.avatar-icon {
  font-size: 32px;
  font-weight: bold;
  z-index: 2;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-avatar:hover .avatar-overlay {
  opacity: 1;
}

.edit-icon {
  font-size: 20px;
}

.user-info {
  flex: 1;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-role {
  margin: 0 0 12px 0;
  opacity: 0.9;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-badge.beginner {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.advanced {
  background: #dcfce7;
  color: #166534;
}

.role-badge.expert {
  background: #fce7f3;
  color: #be185d;
}

.level-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.8rem;
  opacity: 0.8;
  min-width: 40px;
}

.member-since {
  margin: 0 0 16px 0;
  opacity: 0.7;
  font-size: 0.8rem;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.action-btn.small {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn.small:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 0.9rem;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #e2e8f0;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-icon {
  font-size: 2rem;
  margin-right: 12px;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  transition: color 0.3s ease;
}

.stat-card:hover .stat-content h3 {
  color: #667eea;
}

.stat-content p {
  margin: 4px 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.stat-trend {
  margin-top: 4px;
}

.trend-up {
  color: #10b981;
  font-size: 0.8rem;
  font-weight: 600;
}

.trend-down {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
}

/* 任务分析面板 */
.analytics-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.section-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1e293b;
  font-weight: 600;
}

.toggle-btn, .save-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover, .save-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.analytics-content {
  padding: 24px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.analytics-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
}

.analytics-card h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.priority-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 60px;
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-fill.priority-high {
  background: #ef4444;
}

.bar-fill.priority-medium {
  background: #f59e0b;
}

.bar-fill.priority-low {
  background: #10b981;
}

.bar-value {
  width: 80px;
  font-size: 0.8rem;
  color: #6b7280;
  text-align: right;
}

.recent-activity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.activity-item:hover {
  background: #f3f4f6;
}

.activity-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  color: #374151;
}

.activity-time {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* 设置区域 */
.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

.settings-section h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1e293b;
  font-weight: 600;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.setting-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  width: 40px;
  text-align: center;
}

.setting-info h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: #1e293b;
}

.setting-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #667eea;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* 选择框样式 */
.priority-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  min-width: 100px;
}

/* 快速操作 */
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
}

.quick-actions h3 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  color: #1e293b;
  font-weight: 600;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: #475569;
}

.action-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.action-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 12px;
    padding-bottom: 80px;
  }
  
  .user-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
  
  .stat-content h3 {
    font-size: 1.5rem;
  }
  
  .settings-section,
  .quick-actions {
    padding: 20px;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* 档案编辑弹窗样式 */
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

.profile-edit-modal {
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

.edit-form {
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

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

/* 底部导航样式 */
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
  background: #f1f5f9;
  border: none;
  padding: 12px;
  margin: 0 4px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #e2e8f0;
}

.nav-btn.active {
  background: #667eea;
  color: white;
}
</style>