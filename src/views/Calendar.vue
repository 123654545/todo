<template>
  <div class="calendar-container">
    <header class="header">
      <h1>日历视图</h1>
      <button class="back-btn" @click="$router.push('/todos')">返回列表</button>
    </header>

    <div class="calendar-content">
      <div class="calendar-header">
        <button @click="prevMonth" class="nav-btn">‹</button>
        <h2>{{ currentMonth }}</h2>
        <button @click="nextMonth" class="nav-btn">›</button>
      </div>

      <div class="weekdays">
        <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="weekday">
          {{ day }}
        </div>
      </div>

      <div class="calendar-grid">
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          :class="['calendar-day', { 'other-month': !day.isCurrentMonth }]"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <div class="todos-container">
            <div 
              v-for="todo in getTodosForDay(day.date)" 
              :key="todo.id"
              :class="['todo-badge', `priority-${todo.priority}`]"
              :title="todo.title"
            >
              <span class="todo-title">{{ todo.title }}</span>
              <span v-if="todo.dueTime" class="todo-time">{{ todo.dueTime }}</span>
            </div>
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
import { AuthService, TodoService } from '../config/storage.js'

export default {
  name: 'Calendar',
  setup() {
    const router = useRouter()
    const currentDate = ref(new Date())
    const todos = ref([])
    const currentUser = ref(null)
    const isLoading = ref(true)
    
    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      const days = []
      
      // 上个月的最后几天
      const prevMonthLastDay = new Date(year, month, 0).getDate()
      const firstDayOfWeek = firstDay.getDay()
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i)
        days.push({ date, isCurrentMonth: false })
      }
      
      // 当前月的所有天
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i)
        days.push({ date, isCurrentMonth: true })
      }
      
      // 下个月的前几天
      const totalCells = 42 // 6行7列
      const nextMonthDays = totalCells - days.length
      for (let i = 1; i <= nextMonthDays; i++) {
        const date = new Date(year, month + 1, i)
        days.push({ date, isCurrentMonth: false })
      }
      
      return days
    })
    
    const currentMonth = computed(() => {
      return dayjs(currentDate.value).format('YYYY年MM月')
    })
    
    const prevMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
    }
    
    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
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
    
    // 获取指定日期的任务
    const getTodosForDay = (date) => {
      return todos.value.filter(todo => {
        if (!todo.dueDate) return false
        return dayjs(todo.dueDate).isSame(date, 'day')
      })
    }
    
    // 获取任务详情HTML
    const getTodoDetails = (todos) => {
      return todos.map(todo => 
        `<div class="todo-item" style="margin: 2px 0; padding: 4px; background: ${getPriorityColor(todo.priority)}; border-radius: 4px;">
           <div style="font-size: 12px; font-weight: bold;">${todo.title}</div>
           <div style="font-size: 10px; color: #666;">${todo.dueTime || '全天'}</div>
         </div>`
      ).join('')
    }
    
    const getPriorityColor = (priority) => {
      const colors = {
        high: '#fee2e2',
        medium: '#fef3c7',
        low: '#d1fae5'
      }
      return colors[priority] || '#f3f4f6'
    }
    
    // 组件挂载时获取用户信息
    onMounted(() => {
      getCurrentUser()
    })
    
    return {
      calendarDays,
      currentMonth,
      prevMonth,
      nextMonth,
      getTodosForDay,
      getTodoDetails,
      isLoading
    }
  }
}
</script>

<style scoped>
.calendar-container {
  min-height: 100vh;
  background: #f8fafc;
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

.back-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.calendar-content {
  padding: 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-header h2 {
  color: #1e293b;
  font-size: 18px;
}

.nav-btn {
  background: #f1f5f9;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  padding: 12px;
  background: #64748b;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
}

.calendar-day {
  background: white;
  min-height: 100px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.calendar-day.other-month {
  background: #f8fafc;
  color: #94a3b8;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.todos-container {
  flex: 1;
  overflow-y: auto;
  margin-top: 4px;
}

.todo-badge {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  margin-bottom: 2px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.todo-badge.priority-high {
  background: #fee2e2;
  color: #991b1b;
  border-left: 2px solid #ef4444;
}

.todo-badge.priority-medium {
  background: #fef3c7;
  color: #92400e;
  border-left: 2px solid #f59e0b;
}

.todo-badge.priority-low {
  background: #d1fae5;
  color: #065f46;
  border-left: 2px solid #10b981;
}

.todo-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-time {
  font-size: 8px;
  opacity: 0.7;
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