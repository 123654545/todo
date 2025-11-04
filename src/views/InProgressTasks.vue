<template>
  <div class="in-progress-container">
    <header class="header">
      <h1>🚀 进行中任务</h1>
      <button class="back-btn" @click="$router.push('/todos')">返回列表</button>
    </header>

    <div class="tasks-content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-item">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <h3>{{ inProgressTasks.length }}</h3>
            <p>进行中任务</p>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">⏰</div>
          <div class="stat-info">
            <h3>{{ urgentTasks.length }}</h3>
            <p>紧急任务</p>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <h3>{{ todayTasks.length }}</h3>
            <p>今日任务</p>
          </div>
        </div>
      </div>

      <!-- 任务筛选 -->
      <div class="filter-section">
        <div class="filter-group">
          <label>优先级筛选：</label>
          <select v-model="priorityFilter" class="filter-select">
            <option value="all">全部</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>
        <div class="filter-group">
          <label>时间筛选：</label>
          <select v-model="timeFilter" class="filter-select">
            <option value="all">全部</option>
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          :class="['task-card', { urgent: task.priority === 'high', overdue: task.isOverdue }]"
        >
          <div class="task-header">
            <div class="task-priority" :class="`priority-${task.priority}`">
              {{ getPriorityText(task.priority) }}
            </div>
            <div class="task-time">
              <span v-if="task.dueDate">{{ formatDate(task.dueDate) }}</span>
              <span v-if="task.dueTime"> {{ task.dueTime }}</span>
              <span v-if="task.isOverdue" class="overdue-badge">已逾期</span>
            </div>
          </div>
          
          <div class="task-content">
            <h3 class="task-title">{{ task.title }}</h3>
            <p class="task-meta">
              创建时间: {{ formatDateTime(task.created_at) }}
            </p>
          </div>

          <div class="task-actions">
            <button @click="completeTask(task.id)" class="complete-btn">
              ✅ 完成
            </button>
            <button @click="editTask(task)" class="edit-btn">
              ✏️ 编辑
            </button>
            <button @click="deleteTask(task.id)" class="delete-btn">
              🗑️ 删除
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>暂无进行中任务</h3>
          <p>所有任务都已完成，继续保持！</p>
          <button @click="$router.push('/todos')" class="create-task-btn">
            创建新任务
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑任务弹窗 -->
    <div v-if="editingTask" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h3>编辑任务</h3>
        <div class="edit-form">
          <input v-model="editForm.title" placeholder="任务标题" class="edit-input">
          <div class="date-time-row">
            <input v-model="editForm.dueDate" type="date" class="edit-input date-input">
            <input v-model="editForm.dueTime" type="time" class="edit-input time-input">
          </div>
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
import { TodoService } from '../config/storage.js'
import dayjs from 'dayjs'

export default {
  name: 'InProgressTasks',
  setup() {
    const router = useRouter()
    const todos = ref([])
    const priorityFilter = ref('all')
    const timeFilter = ref('all')
    const editingTask = ref(null)
    const editForm = ref({
      title: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium'
    })

    // 加载任务数据
    const loadTodos = async () => {
      try {
        const todoData = await TodoService.getTodos()
        todos.value = todoData.map(todo => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          dueDate: todo.due_date,
          dueTime: todo.due_time,
          priority: todo.priority,
          created_at: todo.created_at,
          isOverdue: todo.due_date && !todo.completed && dayjs(todo.due_date).isBefore(dayjs(), 'day')
        }))
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }

    // 进行中任务（未完成的任务）
    const inProgressTasks = computed(() => {
      return todos.value.filter(todo => !todo.completed)
    })

    // 紧急任务（高优先级且未完成）
    const urgentTasks = computed(() => {
      return inProgressTasks.value.filter(todo => todo.priority === 'high')
    })

    // 今日任务
    const todayTasks = computed(() => {
      return inProgressTasks.value.filter(todo => 
        todo.dueDate && dayjs(todo.dueDate).isSame(dayjs(), 'day')
      )
    })

    // 筛选后的任务
    const filteredTasks = computed(() => {
      let filtered = inProgressTasks.value

      // 优先级筛选
      if (priorityFilter.value !== 'all') {
        filtered = filtered.filter(todo => todo.priority === priorityFilter.value)
      }

      // 时间筛选
      if (timeFilter.value === 'today') {
        filtered = filtered.filter(todo => 
          todo.dueDate && dayjs(todo.dueDate).isSame(dayjs(), 'day')
        )
      } else if (timeFilter.value === 'week') {
        filtered = filtered.filter(todo => 
          todo.dueDate && dayjs(todo.dueDate).isSame(dayjs(), 'week')
        )
      } else if (timeFilter.value === 'overdue') {
        filtered = filtered.filter(todo => todo.isOverdue)
      }

      return filtered
    })

    // 完成任务
    const completeTask = async (taskId) => {
      try {
        await TodoService.toggleTodo(taskId, true)
        await loadTodos()
      } catch (error) {
        console.error('完成任务失败:', error)
      }
    }

    // 编辑任务
    const editTask = (task) => {
      editingTask.value = task
      editForm.value = {
        title: task.title,
        dueDate: task.dueDate || '',
        dueTime: task.dueTime || '',
        priority: task.priority
      }
    }

    // 保存编辑
    const saveEdit = async () => {
      if (editingTask.value && editForm.value.title.trim()) {
        try {
          await TodoService.updateTodo(editingTask.value.id, {
            title: editForm.value.title,
            due_date: editForm.value.dueDate || null,
            due_time: editForm.value.dueTime || null,
            priority: editForm.value.priority
          })
          await loadTodos()
          editingTask.value = null
        } catch (error) {
          console.error('更新任务失败:', error)
        }
      }
    }

    // 取消编辑
    const cancelEdit = () => {
      editingTask.value = null
    }

    // 删除任务
    const deleteTask = async (taskId) => {
      if (confirm('确定要删除这个任务吗？')) {
        try {
          await TodoService.deleteTodo(taskId)
          await loadTodos()
        } catch (error) {
          console.error('删除任务失败:', error)
        }
      }
    }

    // 工具函数
    const getPriorityText = (priority) => {
      const map = { high: '高', medium: '中', low: '低' }
      return map[priority]
    }

    const formatDate = (date) => {
      if (!date) return ''
      return dayjs(date).format('MM月DD日')
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
    }

    onMounted(() => {
      loadTodos()
    })

    return {
      inProgressTasks,
      urgentTasks,
      todayTasks,
      filteredTasks,
      priorityFilter,
      timeFilter,
      editingTask,
      editForm,
      completeTask,
      editTask,
      saveEdit,
      cancelEdit,
      deleteTask,
      getPriorityText,
      formatDate,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.in-progress-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 80px;
}

.header {
  background: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.back-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.tasks-content {
  padding: 20px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: #1e293b;
}

.stat-info p {
  margin: 4px 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.filter-section {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: #64748b;
}

.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #e2e8f0;
}

.task-card.urgent {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.task-card.overdue {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-priority {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
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
  color: #065f46;
}

.task-time {
  font-size: 12px;
  color: #64748b;
}

.overdue-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin-left: 8px;
}

.task-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1e293b;
}

.task-meta {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.task-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.complete-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.edit-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.empty-state p {
  margin: 0 0 20px 0;
}

.create-task-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

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
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.modal-content h3 {
  margin-bottom: 20px;
  text-align: center;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
}

.date-time-row {
  display: flex;
  gap: 12px;
}

.edit-actions {
  display: flex;
  gap: 12px;
}

.save-btn {
  flex: 1;
  background: #10b981;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn {
  flex: 1;
  background: #64748b;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .task-actions {
    flex-direction: column;
  }
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
</style>