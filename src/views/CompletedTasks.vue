<template>
  <div class="completed-tasks-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          ← 返回
        </button>
        <h1>已完成任务</h1>
      </div>
      <div class="header-actions">
        <button class="view-all-btn" @click="viewAllTasks">
          查看所有任务
        </button>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="main-content">
      <!-- 统计信息 -->
      <div class="stats-bar">
        <span class="stat-item">
          已完成: <strong>{{ completedTasks.length }}</strong> 个任务
        </span>
        <span class="stat-item">
          最近完成: <strong>{{ recentCompletedCount }}</strong> 个
        </span>
        <span class="stat-item">
          完成率: <strong>{{ completionRate }}%</strong>
        </span>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-list">
        <div 
          v-for="task in completedTasks" 
          :key="task.id"
          class="task-item completed"
        >
          <div class="task-checkbox">
            <input 
              type="checkbox" 
              :checked="task.completed"
              @change="toggleTask(task.id)"
            >
          </div>
          <div class="task-content">
            <h3 class="task-title">{{ task.title }}</h3>
            <div class="task-meta">
              <span v-if="task.dueDate" class="due-date">
                截止: {{ formatDate(task.dueDate) }}
                <span v-if="task.dueTime"> {{ task.dueTime }}</span>
              </span>
              <span :class="`priority-badge priority-${task.priority}`">
                {{ getPriorityText(task.priority) }}
              </span>
              <span class="completion-time">
                完成于: {{ formatCompletionTime(task.completedAt) }}
              </span>
            </div>
          </div>
          <div class="task-actions">
            <button @click="reopenTask(task.id)" class="action-btn reopen">重新打开</button>
            <button @click="deleteTask(task.id)" class="action-btn delete">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="completedTasks.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <p>暂无已完成任务</p>
        <p class="empty-subtitle">完成任务后，它们会显示在这里</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { AuthService, TodoService } from '../config/storage.js'

export default {
  name: 'CompletedTasks',
  setup() {
    const router = useRouter()
    const currentUser = ref(null)
    const isLoading = ref(true)
    const tasks = ref([])

    // 获取当前用户
    const getCurrentUser = async () => {
      try {
        const { data } = await AuthService.getCurrentUser()
        currentUser.value = data.user
        if (!currentUser.value) {
          router.push('/login')
          return
        }
        await loadTasks()
      } catch (error) {
        console.error('获取用户失败:', error)
        router.push('/login')
      } finally {
        isLoading.value = false
      }
    }

    // 加载所有任务
    const loadTasks = async () => {
      try {
        const todoData = await TodoService.getTodos()
        tasks.value = todoData.map(todo => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          dueDate: todo.due_date,
          dueTime: todo.due_time,
          priority: todo.priority,
          nluRaw: todo.nlu_raw,
          completedAt: todo.updated_at // 假设更新时间为完成时间
        }))
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }

    // 已完成的任务
    const completedTasks = computed(() => 
      tasks.value.filter(task => task.completed)
    )

    // 最近完成的任务数量（7天内）
    const recentCompletedCount = computed(() => {
      const sevenDaysAgo = dayjs().subtract(7, 'day')
      return completedTasks.value.filter(task => 
        task.completedAt && dayjs(task.completedAt).isAfter(sevenDaysAgo)
      ).length
    })

    // 完成率
    const completionRate = computed(() => {
      if (tasks.value.length === 0) return 0
      return Math.round((completedTasks.value.length / tasks.value.length) * 100)
    })

    // 任务操作
    const toggleTask = async (id) => {
      const task = tasks.value.find(t => t.id === id)
      if (task) {
        const newCompleted = !task.completed
        task.completed = newCompleted
        
        try {
          await TodoService.toggleTodo(id, newCompleted)
          // 如果任务被重新打开，从已完成列表中移除
          if (!newCompleted) {
            // 重新加载任务列表
            await loadTasks()
          }
        } catch (error) {
          console.error('更新任务状态失败:', error)
          task.completed = !newCompleted
        }
      }
    }

    // 重新打开任务
    const reopenTask = async (id) => {
      try {
        await TodoService.toggleTodo(id, false)
        // 重新加载任务列表
        await loadTasks()
      } catch (error) {
        console.error('重新打开任务失败:', error)
      }
    }

    const deleteTask = async (id) => {
      try {
        await TodoService.deleteTodo(id)
        tasks.value = tasks.value.filter(t => t.id !== id)
      } catch (error) {
        console.error('删除任务失败:', error)
      }
    }

    const goBack = () => {
      router.push('/profile')
    }

    const viewAllTasks = () => {
      router.push('/all-tasks')
    }

    const handleLogout = async () => {
      try {
        await AuthService.signOut()
        router.push('/login')
      } catch (error) {
        console.error('退出失败:', error)
        router.push('/login')
      }
    }

    const formatDate = (date) => dayjs(date).format('MM月DD日')
    
    const formatCompletionTime = (time) => {
      if (!time) return '未知时间'
      return dayjs(time).format('MM月DD日 HH:mm')
    }
    
    const getPriorityText = (priority) => {
      const map = { high: '高', medium: '中', low: '低' }
      return map[priority]
    }

    onMounted(() => {
      getCurrentUser()
    })

    return {
      completedTasks,
      recentCompletedCount,
      completionRate,
      isLoading,
      toggleTask,
      reopenTask,
      deleteTask,
      goBack,
      viewAllTasks,
      handleLogout,
      formatDate,
      formatCompletionTime,
      getPriorityText
    }
  }
}
</script>

<style scoped>
.completed-tasks-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 80px;
}

.header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: #f1f5f9;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  background: #e2e8f0;
}

h1 {
  color: #1e293b;
  font-size: 20px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-all-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.view-all-btn:hover {
  background: #2563eb;
}

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.main-content {
  padding: 20px;
}

.stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.stat-item {
  color: #64748b;
  font-size: 14px;
}

.stat-item strong {
  color: #1e293b;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-item.completed {
  opacity: 0.7;
  background: #f0f9ff;
  border-left: 4px solid #10b981;
}

.task-checkbox input {
  width: 18px;
  height: 18px;
}

.task-content {
  flex: 1;
}

.task-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #64748b;
  text-decoration: line-through;
}

.task-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.due-date, .completion-time {
  color: #94a3b8;
  font-size: 14px;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-high {
  background: #fee2e2;
  color: #dc2626;
}

.priority-medium {
  background: #fef3c7;
  color: #d97706;
}

.priority-low {
  background: #d1fae5;
  color: #059669;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.action-btn.reopen {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.action-btn.delete {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
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
  padding: 12px;
  gap: 8px;
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
</style>