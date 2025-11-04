<template>
  <div class="todo-container">
    <header class="header">
      <h1>我的待办</h1>
      <div class="header-actions">
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="main-content">
      <!-- 搜索框 -->
      <div class="search-section">
        <input 
          v-model="searchQuery" 
          placeholder="搜索任务名称或日期..."
          class="search-input"
        >
        <select v-model="searchFilter" class="filter-select">
          <option value="all">全部</option>
          <option value="title">任务名</option>
          <option value="date">日期</option>
        </select>
      </div>

      <!-- 自然语言输入框 -->
      <div class="nl-input-section">
        <textarea 
          v-model="nlInput" 
          placeholder="用自然语言输入任务，例如：明早9点开会 准备汇报PPT"
          @keydown.enter.prevent="addTodoFromNL"
          class="nl-input"
          rows="2"
        ></textarea>
        
        <!-- 优先级选择器 -->
        <div class="priority-selector">
          <label>优先级：</label>
          <select v-model="selectedPriority" class="priority-dropdown">
            <option 
              v-for="option in priorityOptions" 
              :key="option.value"
              :value="option.value"
              :class="`priority-${option.value}`"
            >
              {{ option.icon }} {{ option.label }}
            </option>
          </select>
        </div>
        
        <button @click="addTodoFromNL" class="add-btn">添加</button>
      </div>

      <!-- 日期提醒弹窗 -->
      <div v-if="showDateWarning" class="modal-overlay">
        <div class="modal-content">
          <h3>日期提醒</h3>
          <p>您设置的日期（{{ pendingTaskDate }}）在当前月份已过，是否顺延到下个月？</p>
          <div class="modal-actions">
            <button @click="confirmPostpone" class="confirm-btn">是，顺延</button>
            <button @click="cancelTask" class="cancel-btn">否，取消任务</button>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="todo-list">
        <div 
          v-for="todo in filteredTodos" 
          :key="todo.id"
          :class="['todo-item', { completed: todo.completed }]"
        >
          <input 
            type="checkbox" 
            :checked="todo.completed"
            @change="toggleTodo(todo.id)"
            class="todo-checkbox"
          >
          <div class="todo-content" @click="editTodo(todo)">
            <h3>{{ todo.title }}</h3>
            <p class="todo-meta">
              <span v-if="todo.dueDate">截止: {{ formatDate(todo.dueDate) }}</span>
              <span v-if="todo.dueTime"> {{ todo.dueTime }}</span>
              <span v-if="calculateIsOverdue(todo)" class="overdue-badge">已逾期</span>
              <span v-if="todo.priority" :class="`priority-${todo.priority}`">
                {{ getPriorityText(todo.priority) }}
              </span>
            </p>
          </div>
          <div class="todo-actions">
            <button @click="editTodo(todo)" class="edit-btn">编辑</button>
            <button @click="deleteTodo(todo.id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑任务弹窗 -->
    <div v-if="editingTodo" class="modal-overlay" @click="cancelEdit">
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
import { smartParseTodo } from '../utils/dateParser'
import { AuthService, TodoService } from '../config/storage.js'
import { supabase } from '../config/supabase.js'

export default {
  name: 'TodoList',
  setup() {
    const router = useRouter()
    const nlInput = ref('')
    const searchQuery = ref('')
    const searchFilter = ref('all')
    const editingTodo = ref(null)
    const editForm = ref({
      title: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium'
    })
    const currentUser = ref(null)
    const isLoading = ref(true)

    const todos = ref([])
    
    // 优先级配置
    const priorityOptions = ref([
      { value: 'high', label: '高优先级', icon: '🔥', description: '紧急且重要，需要立即处理' },
      { value: 'medium', label: '中优先级', icon: '⚡', description: '重要但不紧急，需要安排时间处理' },
      { value: 'low', label: '低优先级', icon: '💤', description: '不紧急，可以稍后处理' }
    ])
    const selectedPriority = ref('medium') // 初始值，会被loadUserSettings覆盖 // 初始值，会被loadUserSettings覆盖
    
    // 日期验证相关状态
    const showDateWarning = ref(false)
    const pendingTask = ref(null)
    const pendingTaskDate = ref('')

    // 加载用户设置
    const loadUserSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('default_priority')
          .eq('user_id', currentUser.value.id)
          .limit(1)
        
        if (error) throw error
        
        // 如果有设置记录且设置了默认优先级，则使用用户设置
        if (data && data.length > 0 && data[0].default_priority) {
          selectedPriority.value = data[0].default_priority
        }
        // 如果没有设置记录，保持默认的'medium'值
        console.log('加载用户设置完成，当前优先级:', selectedPriority.value)
      } catch (error) {
        console.error('加载用户设置失败:', error)
        // 出错时保持默认值
        selectedPriority.value = 'medium'
      }
    }

    // 获取当前用户
    const getCurrentUser = async () => {
      try {
        const { data } = await AuthService.getCurrentUser()
        currentUser.value = data.user
        if (!currentUser.value) {
          router.push('/login')
          return
        }
        await loadUserSettings()
        await loadTodos()
      } catch (error) {
        console.error('获取用户失败:', error)
        router.push('/login')
      } finally {
        isLoading.value = false
      }
    }

    // 加载任务列表
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
          nluRaw: todo.nlu_raw
        }))
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    }

    // 计算精确到分钟的逾期状态
    const calculateIsOverdue = (todo) => {
      if (!todo.dueDate || todo.completed) return false
      
      // 构建完整的日期时间字符串
      const dueDateTime = `${todo.dueDate} ${todo.dueTime || '23:59'}`
      const dueDateObj = dayjs(dueDateTime)
      const now = dayjs()
      
      return dueDateObj.isBefore(now)
    }

    const filteredTodos = computed(() => {
      if (!searchQuery.value.trim()) {
        return todos.value
      }

      const query = searchQuery.value.toLowerCase()
      return todos.value.filter(todo => {
        if (searchFilter.value === 'title') {
          return todo.title.toLowerCase().includes(query)
        } else if (searchFilter.value === 'date') {
          return todo.dueDate && todo.dueDate.includes(query)
        } else {
          return todo.title.toLowerCase().includes(query) || 
                 (todo.dueDate && todo.dueDate.includes(query))
        }
      })
    })

    const addTodoFromNL = async () => {
      if (nlInput.value.trim()) {
        try {
          // 显示加载状态
          const originalText = nlInput.value
          nlInput.value = '解析中...'
          
          // 使用智能解析
          const parsedTodo = await smartParseTodo(originalText)
          
          // 恢复输入框内容
          nlInput.value = ''
          
          // 检查日期是否在当前月份已过
          if (parsedTodo.dueDate) {
            const taskDate = dayjs(parsedTodo.dueDate)
            const today = dayjs()
            
            // 如果日期在当前月份且已过，显示弹窗提醒
            if (taskDate.isSame(today, 'month') && taskDate.isBefore(today, 'day')) {
              pendingTask.value = parsedTodo
              pendingTaskDate.value = taskDate.format('YYYY-MM-DD')
              showDateWarning.value = true
              return // 等待用户选择
            }
          }
          
          // 使用用户选择的优先级覆盖自动判断的优先级
          parsedTodo.priority = selectedPriority.value
          
          // 直接创建任务
          await createTask(parsedTodo)
          nlInput.value = ''
          console.log('任务创建完成，优先级设置为:', selectedPriority.value)
        } catch (error) {
          console.error('添加任务失败:', error)
          // 恢复输入框内容
          nlInput.value = originalText
        }
      }
    }

    // 创建任务辅助函数
    const createTask = async (parsedTodo) => {
      try {
        const newTodo = await TodoService.createTodo({
          title: parsedTodo.title,
          due_date: parsedTodo.dueDate,
          due_time: parsedTodo.dueTime,
          priority: parsedTodo.priority,
          nlu_raw: parsedTodo.nluRaw
        })
        
        // 添加到本地列表
        todos.value.unshift({
          id: newTodo.id,
          title: newTodo.title,
          completed: newTodo.completed,
          dueDate: newTodo.due_date,
          dueTime: newTodo.due_time,
          priority: newTodo.priority,
          nluRaw: newTodo.nlu_raw
        })
      } catch (error) {
        throw error
      }
    }

    // 确认顺延到下个月
    const confirmPostpone = async () => {
      if (pendingTask.value) {
        // 将日期顺延到下个月
        const originalDate = dayjs(pendingTask.value.dueDate)
        const postponedDate = originalDate.add(1, 'month').format('YYYY-MM-DD')
        
        // 使用用户选择的优先级
        pendingTask.value.priority = selectedPriority.value
        pendingTask.value.dueDate = postponedDate
        await createTask(pendingTask.value)
        
        // 重置状态
        resetPendingTask()
        nlInput.value = ''
      }
    }

    // 取消任务创建
    const cancelTask = () => {
      resetPendingTask()
      nlInput.value = ''
    }

    // 重置待处理任务状态
    const resetPendingTask = () => {
      showDateWarning.value = false
      pendingTask.value = null
      pendingTaskDate.value = ''
    }

    const toggleTodo = async (id) => {
      const todo = todos.value.find(t => t.id === id)
      if (todo) {
        const newCompleted = !todo.completed
        todo.completed = newCompleted
        
        try {
          await TodoService.toggleTodo(id, newCompleted)
        } catch (error) {
          console.error('更新任务状态失败:', error)
          // 回滚本地状态
          todo.completed = !newCompleted
        }
      }
    }

    const editTodo = (todo) => {
      editingTodo.value = todo
      editForm.value = {
        title: todo.title,
        dueDate: todo.dueDate || '',
        dueTime: todo.dueTime || '',
        priority: todo.priority
      }
    }

    const saveEdit = async () => {
      if (editingTodo.value && editForm.value.title.trim()) {
        try {
          // 更新数据库
          await TodoService.updateTodo(editingTodo.value.id, {
            title: editForm.value.title,
            due_date: editForm.value.dueDate || null,
            due_time: editForm.value.dueTime || null,
            priority: editForm.value.priority
          })
          
          // 更新本地状态
          Object.assign(editingTodo.value, editForm.value)
          editingTodo.value = null
          editForm.value = { title: '', dueDate: '', dueTime: '', priority: selectedPriority.value }
        } catch (error) {
          console.error('更新任务失败:', error)
        }
      }
    }

    const cancelEdit = () => {
      editingTodo.value = null
      editForm.value = { title: '', dueDate: '', dueTime: '', priority: selectedPriority.value }
    }

    const deleteTodo = async (id) => {
      try {
        await TodoService.deleteTodo(id)
        todos.value = todos.value.filter(t => t.id !== id)
      } catch (error) {
        console.error('删除任务失败:', error)
      }
    }

    const formatDate = (date) => dayjs(date).format('MM月DD日')

    const getPriorityText = (priority) => {
      const map = { high: '高', medium: '中', low: '低' }
      return map[priority]
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

    // 组件挂载时获取用户信息
    onMounted(() => {
      getCurrentUser()
      
      // 监听设置变化事件
      window.addEventListener('settingsUpdated', async (event) => {
        if (event.detail && event.detail.defaultPriority) {
          selectedPriority.value = event.detail.defaultPriority
          console.log('设置已更新，当前优先级:', selectedPriority.value)
        }
      })
    })

    return {
      nlInput,
      searchQuery,
      searchFilter,
      editingTodo,
      editForm,
      filteredTodos,
      isLoading,
      showDateWarning,
      pendingTaskDate,
      priorityOptions,
      selectedPriority,
      addTodoFromNL,
      toggleTodo,
      editTodo,
      saveEdit,
      cancelEdit,
      deleteTodo,
      formatDate,
      getPriorityText,
      handleLogout,
      confirmPostpone,
      cancelTask,
      calculateIsOverdue
    }
  }
}
</script>

<style scoped>
.todo-container {
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

h1 {
  color: #1e293b;
  font-size: 20px;
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

.search-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}

.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  background: white;
}

.nl-input-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nl-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}

.priority-selector {
  margin-bottom: 12px;
}

.priority-selector label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
  display: block;
}

.priority-dropdown {
  width: 200px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.priority-dropdown:hover {
  border-color: #cbd5e1;
}

.priority-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 下拉选项样式 */
.priority-dropdown option {
  padding: 8px 12px;
}

.priority-dropdown option.priority-high {
  color: #ef4444;
}

.priority-dropdown option.priority-medium {
  color: #f59e0b;
}

.priority-dropdown option.priority-low {
  color: #10b981;
}

.add-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.todo-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
}

.todo-content {
  flex: 1;
  cursor: pointer;
}

.todo-content h3 {
  font-size: 14px;
  margin-bottom: 4px;
  color: #1e293b;
}

.todo-meta {
  font-size: 12px;
  color: #64748b;
  display: flex;
  gap: 12px;
}

.priority-high { color: #ef4444; }
.priority-medium { color: #f59e0b; }
.priority-low { color: #10b981; }

/* 深色模式样式 */
:global(.dark) .todo-container {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

:global(.dark) .header {
  background: var(--bg-secondary);
  border-bottom-color: var(--border-color);
}

:global(.dark) .search-input,
:global(.dark) .filter-select,
:global(.dark) .nl-input {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:global(.dark) .todo-item {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

:global(.dark) .todo-item.completed {
  background: var(--bg-secondary);
  opacity: 0.7;
}

:global(.dark) .modal-overlay {
  background: rgba(0, 0, 0, 0.7);
}

:global(.dark) .modal-content {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

:global(.dark) .edit-input {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:global(.dark) .bottom-nav {
  background: var(--bg-secondary);
  border-top-color: var(--border-color);
}

:global(.dark) .nav-btn {
  color: var(--text-primary);
}

:global(.dark) .nav-btn.active {
  background: var(--accent-color);
  color: white;
}

.todo-actions {
  display: flex;
  gap: 8px;
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
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #1e293b;
  text-align: center;
}

.modal-content p {
  margin-bottom: 24px;
  color: #64748b;
  text-align: center;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn:hover {
  background: #059669;
}

.cancel-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #dc2626;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}

.date-time-row {
  display: flex;
  gap: 12px;
}

.date-input {
  flex: 2;
}

.time-input {
  flex: 1;
}

.overdue-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.overdue-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.date-time-row {
  display: flex;
  gap: 12px;
}

.date-input {
  flex: 2;
}

.time-input {
  flex: 1;
}

.overdue-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.overdue-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
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