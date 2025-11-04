<template>
  <div class="all-tasks-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          ← 返回
        </button>
        <h1>所有任务</h1>
      </div>
      <div class="header-actions">
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="main-content">
      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <input 
          v-model="searchQuery" 
          placeholder="搜索任务名称..."
          class="search-input"
        >
        <select v-model="statusFilter" class="filter-select">
          <option value="all">全部状态</option>
          <option value="completed">已完成</option>
          <option value="pending">未完成</option>
          <option value="overdue">已逾期</option>
        </select>
        <select v-model="priorityFilter" class="filter-select">
          <option value="all">全部优先级</option>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
      </div>

      <!-- 任务统计 -->
      <div class="stats-bar">
        <span class="stat-item">
          总计: <strong>{{ filteredTasks.length }}</strong> 个任务
        </span>
        <span class="stat-item">
          已完成: <strong>{{ completedCount }}</strong>
        </span>
        <span class="stat-item">
          未完成: <strong>{{ pendingCount }}</strong>
        </span>
        <span class="stat-item">
          已逾期: <strong>{{ overdueCount }}</strong>
        </span>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          :class="['task-item', { 
            completed: task.completed,
            overdue: task.isOverdue
          }]"
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
              <span v-if="task.isOverdue" class="overdue-badge">已逾期</span>
            </div>
          </div>
          <div class="task-actions">
            <button @click="editTask(task)" class="action-btn edit">编辑</button>
            <button @click="deleteTask(task.id)" class="action-btn delete">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无任务</p>
      </div>
    </div>

    <!-- 编辑任务弹窗 -->
    <div v-if="editingTask" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h3>编辑任务</h3>
        <div class="edit-form">
          <input v-model="editForm.title" placeholder="任务标题" class="edit-input">
          <input v-model="editForm.dueDate" type="date" class="edit-input">
          <select v-model="editForm.priority" class="edit-input">
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <div class="edit-actions">
            <button @click="saveEdit" class="save-btn">保存</button>
            <button @click="cancelEdit" class="cancel-btn">取消</button>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { AuthService, TodoService } from '../config/storage.js'

export default {
  name: 'AllTasks',
  setup() {
    const router = useRouter()
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const priorityFilter = ref('all')
    const editingTask = ref(null)
    const editForm = ref({
      title: '',
      dueDate: '',
      priority: 'medium'
    })
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
          isOverdue: todo.due_date && !todo.completed && dayjs(todo.due_date).isBefore(dayjs(), 'day')
        }))
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }

    // 过滤任务
    const filteredTasks = computed(() => {
      let filtered = tasks.value
      
      // 搜索过滤
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(query)
        )
      }
      
      // 状态过滤
      if (statusFilter.value !== 'all') {
        switch (statusFilter.value) {
          case 'completed':
            filtered = filtered.filter(task => task.completed)
            break
          case 'pending':
            filtered = filtered.filter(task => !task.completed)
            break
          case 'overdue':
            filtered = filtered.filter(task => task.isOverdue)
            break
        }
      }
      
      // 优先级过滤
      if (priorityFilter.value !== 'all') {
        filtered = filtered.filter(task => task.priority === priorityFilter.value)
      }
      
      return filtered
    })

    // 统计信息
    const completedCount = computed(() => 
      tasks.value.filter(task => task.completed).length
    )
    
    const pendingCount = computed(() => 
      tasks.value.filter(task => !task.completed).length
    )
    
    const overdueCount = computed(() => 
      tasks.value.filter(task => task.isOverdue).length
    )

    // 任务操作
    const toggleTask = async (id) => {
      const task = tasks.value.find(t => t.id === id)
      if (task) {
        const newCompleted = !task.completed
        task.completed = newCompleted
        
        try {
          await TodoService.toggleTodo(id, newCompleted)
        } catch (error) {
          console.error('更新任务状态失败:', error)
          task.completed = !newCompleted
        }
      }
    }

    const editTask = (task) => {
      editingTask.value = task
      editForm.value = {
        title: task.title,
        dueDate: task.dueDate || '',
        priority: task.priority
      }
    }

    const saveEdit = async () => {
      if (editingTask.value && editForm.value.title.trim()) {
        try {
          await TodoService.updateTodo(editingTask.value.id, {
            title: editForm.value.title,
            due_date: editForm.value.dueDate || null,
            priority: editForm.value.priority
          })
          
          Object.assign(editingTask.value, editForm.value)
          editingTask.value.isOverdue = editingTask.value.dueDate && 
            !editingTask.value.completed && 
            dayjs(editingTask.value.dueDate).isBefore(dayjs(), 'day')
          
          editingTask.value = null
          editForm.value = { title: '', dueDate: '', priority: 'medium' }
        } catch (error) {
          console.error('更新任务失败:', error)
        }
      }
    }

    const cancelEdit = () => {
      editingTask.value = null
      editForm.value = { title: '', dueDate: '', priority: 'medium' }
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
    
    const getPriorityText = (priority) => {
      const map = { high: '高', medium: '中', low: '低' }
      return map[priority]
    }

    onMounted(() => {
      getCurrentUser()
    })

    return {
      searchQuery,
      statusFilter,
      priorityFilter,
      editingTask,
      editForm,
      filteredTasks,
      completedCount,
      pendingCount,
      overdueCount,
      isLoading,
      toggleTask,
      editTask,
      saveEdit,
      cancelEdit,
      deleteTask,
      goBack,
      handleLogout,
      formatDate,
      getPriorityText
    }
  }
}
</script>

<style scoped>
.all-tasks-container {
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

.main-content {
  padding: 20px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
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
  background: #f8fafc;
}

.task-item.overdue {
  border-left: 4px solid #ef4444;
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
  color: #1e293b;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #64748b;
}

.task-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.due-date {
  color: #64748b;
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

.overdue-badge {
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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

.action-btn.edit {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
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

/* 弹窗样式 */
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
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.edit-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.save-btn, .cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background: #10b981;
  color: white;
}

.cancel-btn {
  background: #6b7280;
  color: white;
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