<template>
  <div class="overdue-tasks-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          ← 返回
        </button>
        <h1>已逾期任务</h1>
      </div>
      <div class="header-actions">
        <button class="view-all-btn" @click="viewAllTasks">
          查看所有任务
        </button>
        <button class="view-completed-btn" @click="viewCompletedTasks">
          查看已完成
        </button>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="main-content">
      <!-- 统计信息 -->
      <div class="stats-bar">
        <span class="stat-item">
          已逾期: <strong>{{ overdueTasks.length }}</strong> 个任务
        </span>
        <span class="stat-item">
          今日逾期: <strong>{{ todayOverdueCount }}</strong> 个
        </span>
        <span class="stat-item">
          严重逾期: <strong>{{ criticalOverdueCount }}</strong> 个
        </span>
        <span class="stat-item">
          逾期率: <strong>{{ overdueRate }}%</strong>
        </span>
      </div>

      <!-- 逾期任务列表 -->
      <div class="tasks-list">
        <div 
          v-for="task in overdueTasks" 
          :key="task.id"
          :class="['task-item', { 
            'critical-overdue': task.isCriticalOverdue,
            'today-overdue': task.isTodayOverdue
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
              <span class="due-date overdue">
                逾期: {{ formatOverdueDays(task.dueDate) }} 天
              </span>
              <span :class="`priority-badge priority-${task.priority}`">
                {{ getPriorityText(task.priority) }}
              </span>
              <span class="original-due">
                原定: {{ formatDate(task.dueDate) }}
                <span v-if="task.dueTime"> {{ task.dueTime }}</span>
              </span>
            </div>
            <div class="overdue-warning" v-if="task.isCriticalOverdue">
              ⚠️ 严重逾期，请尽快处理
            </div>
          </div>
          <div class="task-actions">
            <button @click="markAsCompleted(task.id)" class="action-btn complete">标记完成</button>
            <button @click="editDueDate(task)" class="action-btn edit">修改日期</button>
            <button @click="deleteTask(task.id)" class="action-btn delete">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="overdueTasks.length === 0" class="empty-state">
        <div class="empty-icon">⏰</div>
        <p>暂无逾期任务</p>
        <p class="empty-subtitle">太棒了！所有任务都按时完成</p>
      </div>
    </div>

    <!-- 修改日期弹窗 -->
    <div v-if="editingTask" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h3>修改截止日期</h3>
        <div class="edit-form">
          <div class="form-group">
            <label>任务标题</label>
            <input v-model="editForm.title" readonly class="edit-input" />
          </div>
          <div class="form-group">
            <label>新的截止日期</label>
            <input v-model="editForm.newDueDate" type="date" class="edit-input" />
          </div>
          <div class="edit-actions">
            <button @click="saveNewDueDate" class="save-btn">保存</button>
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
  name: 'OverdueTasks',
  setup() {
    const router = useRouter()
    const currentUser = ref(null)
    const isLoading = ref(true)
    const tasks = ref([])
    const editingTask = ref(null)
    const editForm = ref({
      title: '',
      newDueDate: ''
    })

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
        tasks.value = todoData.map(todo => {
          const dueDate = todo.due_date
          const isOverdue = dueDate && !todo.completed && dayjs(dueDate).isBefore(dayjs(), 'day')
          const overdueDays = isOverdue ? dayjs().diff(dayjs(dueDate), 'day') : 0
          
          return {
            id: todo.id,
            title: todo.title,
            completed: todo.completed,
            dueDate: dueDate,
            dueTime: todo.due_time,
            priority: todo.priority,
            nluRaw: todo.nlu_raw,
            isOverdue: isOverdue,
            overdueDays: overdueDays,
            isTodayOverdue: isOverdue && dayjs(dueDate).isSame(dayjs().subtract(1, 'day'), 'day'),
            isCriticalOverdue: overdueDays > 3
          }
        })
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }

    // 已逾期的任务
    const overdueTasks = computed(() => 
      tasks.value.filter(task => task.isOverdue)
    )

    // 今日逾期任务数量
    const todayOverdueCount = computed(() => 
      overdueTasks.value.filter(task => task.isTodayOverdue).length
    )

    // 严重逾期任务数量（逾期超过3天）
    const criticalOverdueCount = computed(() => 
      overdueTasks.value.filter(task => task.isCriticalOverdue).length
    )

    // 逾期率
    const overdueRate = computed(() => {
      const totalPending = tasks.value.filter(task => !task.completed).length
      if (totalPending === 0) return 0
      return Math.round((overdueTasks.value.length / totalPending) * 100)
    })

    // 任务操作
    const toggleTask = async (id) => {
      const task = tasks.value.find(t => t.id === id)
      if (task) {
        const newCompleted = !task.completed
        task.completed = newCompleted
        
        try {
          await TodoService.toggleTodo(id, newCompleted)
          // 重新加载任务列表
          await loadTasks()
        } catch (error) {
          console.error('更新任务状态失败:', error)
          task.completed = !newCompleted
        }
      }
    }

    // 标记为完成
    const markAsCompleted = async (id) => {
      try {
        await TodoService.toggleTodo(id, true)
        // 重新加载任务列表
        await loadTasks()
      } catch (error) {
        console.error('标记任务完成失败:', error)
      }
    }

    // 修改截止日期
    const editDueDate = (task) => {
      editingTask.value = task
      editForm.value = {
        title: task.title,
        newDueDate: task.dueDate || dayjs().format('YYYY-MM-DD')
      }
    }

    const saveNewDueDate = async () => {
      if (editingTask.value && editForm.value.newDueDate) {
        try {
          await TodoService.updateTodo(editingTask.value.id, {
            due_date: editForm.value.newDueDate
          })
          // 重新加载任务列表
          await loadTasks()
          editingTask.value = null
          editForm.value = { title: '', newDueDate: '' }
        } catch (error) {
          console.error('修改截止日期失败:', error)
        }
      }
    }

    const cancelEdit = () => {
      editingTask.value = null
      editForm.value = { title: '', newDueDate: '' }
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

    const viewCompletedTasks = () => {
      router.push('/completed-tasks')
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
    
    const formatOverdueDays = (dueDate) => {
      if (!dueDate) return 0
      return dayjs().diff(dayjs(dueDate), 'day')
    }
    
    const getPriorityText = (priority) => {
      const map = { high: '高', medium: '中', low: '低' }
      return map[priority]
    }

    onMounted(() => {
      getCurrentUser()
    })

    return {
      overdueTasks,
      todayOverdueCount,
      criticalOverdueCount,
      overdueRate,
      isLoading,
      editingTask,
      editForm,
      toggleTask,
      markAsCompleted,
      editDueDate,
      saveNewDueDate,
      cancelEdit,
      deleteTask,
      goBack,
      viewAllTasks,
      viewCompletedTasks,
      handleLogout,
      formatDate,
      formatOverdueDays,
      getPriorityText
    }
  }
}
</script>

<style scoped>
.overdue-tasks-container {
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

.view-all-btn, .view-completed-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.view-all-btn:hover, .view-completed-btn:hover {
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

.task-item.today-overdue {
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

.task-item.critical-overdue {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
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

.task-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.due-date.overdue {
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
}

.original-due {
  color: #94a3b8;
  font-size: 12px;
}

.overdue-warning {
  color: #dc2626;
  font-size: 12px;
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
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

.action-btn.complete {
  background: #10b981;
  color: white;
  border-color: #10b981;
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

.empty-subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.edit-input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.edit-input:read-only {
  background: #f9fafb;
  color: #6b7280;
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
  padding: 12px 0;
}

.nav-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 12px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
}

.nav-btn.active {
  color: #3b82f6;
}
</style>