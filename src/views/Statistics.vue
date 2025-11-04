<template>
  <div class="statistics-container">
    <header class="header">
      <h1>📊 任务统计</h1>
      <div class="header-actions">
        <button class="back-btn" @click="$router.push('/todos')">返回列表</button>
      </div>
    </header>

    <div class="stats-content">
      <!-- 总体统计卡片 -->
      <div class="overview-cards">
        <div class="stat-card total">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <h3>{{ stats.totalTasks }}</h3>
            <p>总任务数</p>
          </div>
        </div>
        
        <div class="stat-card completed">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ stats.completedTasks }}</h3>
            <p>已完成</p>
          </div>
        </div>
        
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <h3>{{ stats.pendingTasks }}</h3>
            <p>待完成</p>
          </div>
        </div>
        
        <div class="stat-card overdue">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <h3>{{ stats.overdueTasks }}</h3>
            <p>已逾期</p>
          </div>
        </div>
      </div>

      <!-- 完成率图表 -->
      <div class="completion-section">
        <h2>完成率统计</h2>
        <div class="completion-chart">
          <div class="progress-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" stroke="#e0e0e0" stroke-width="8" fill="none"/>
              <circle 
                cx="60" cy="60" r="54" 
                :stroke="completionColor" 
                stroke-width="8" 
                fill="none"
                stroke-dasharray="339.292" 
                :stroke-dashoffset="339.292 * (1 - stats.completionRate / 100)"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="65" text-anchor="middle" font-size="20" font-weight="bold">
                {{ Math.round(stats.completionRate) }}%
              </text>
            </svg>
          </div>
          <div class="completion-info">
            <p class="completion-text">总体完成率</p>
            <div class="completion-details">
              <span class="detail-item">
                <span class="dot completed"></span>
                已完成: {{ stats.completedTasks }}
              </span>
              <span class="detail-item">
                <span class="dot pending"></span>
                待完成: {{ stats.pendingTasks }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 周统计 -->
      <div class="weekly-stats">
        <h2>本周统计</h2>
        <div class="week-chart">
          <div 
            v-for="day in weeklyStats" 
            :key="day.day"
            class="day-bar"
          >
            <div class="bar-container">
              <div 
                class="completed-bar" 
                :style="{ height: day.completionRate + '%' }"
              ></div>
            </div>
            <span class="day-label">{{ day.day }}</span>
            <span class="day-stats">{{ day.completed }}/{{ day.total }}</span>
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
import { TodoService } from '../services/todoService.js'
import dayjs from 'dayjs'

export default {
  name: 'Statistics',
  setup() {
    const todos = ref([])
    const stats = ref({
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionRate: 0
    })

    const weeklyStats = ref([])
    const categoryStats = ref([])

    // 计算完成率颜色
    const completionColor = computed(() => {
      const rate = stats.value.completionRate
      if (rate >= 80) return '#4CAF50'
      if (rate >= 60) return '#FF9800'
      return '#F44336'
    })

    // 数据验证和清理函数
    const validateAndCleanData = (todos) => {
      return todos.map(todo => {
        // 验证必填字段
        if (!todo.id || !todo.created_at) {
          console.warn('发现无效任务数据，跳过:', todo)
          return null
        }
        
        // 清理和标准化数据
        return {
          ...todo,
          // 确保日期格式正确
          created_at: dayjs(todo.created_at).isValid() ? todo.created_at : new Date().toISOString(),
          updated_at: todo.updated_at && dayjs(todo.updated_at).isValid() ? todo.updated_at : todo.created_at,
          due_date: todo.due_date && dayjs(todo.due_date).isValid() ? todo.due_date : null,
          // 确保布尔值正确
          completed: !!todo.completed
        }
      }).filter(Boolean) // 过滤掉无效数据
    }

    // 加载任务数据
    const loadTodos = async () => {
      try {
        const rawTodos = await TodoService.getTodos()
        // 应用数据验证和清理
        todos.value = validateAndCleanData(rawTodos)
        
        // 详细调试：显示所有任务数据
        console.log('=== 所有任务数据 ===')
        todos.value.forEach((todo, index) => {
          console.log(`${index + 1}. ${todo.title}`)
          console.log(`   创建时间: ${dayjs(todo.created_at).format('YYYY-MM-DD HH:mm')}`)
          console.log(`   更新时间: ${todo.updated_at ? dayjs(todo.updated_at).format('YYYY-MM-DD HH:mm') : '无'}`)
          console.log(`   完成状态: ${todo.completed ? '已完成' : '未完成'}`)
          console.log('   ---')
        })
        
        calculateStats()
        calculateWeeklyStats()
      } catch (error) {
        console.error('加载任务数据失败:', error)
      }
    }

    // 计算总体统计
    const calculateStats = () => {
      const total = todos.value.length
      const completed = todos.value.filter(todo => todo.completed).length
      const pending = todos.value.filter(todo => !todo.completed).length
      const overdue = todos.value.filter(todo => 
        !todo.completed && todo.due_date && dayjs(todo.due_date).isBefore(dayjs(), 'day')
      ).length
      
      stats.value = {
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      }
    }

    // 全新重写：简单直接的周统计逻辑
    const calculateWeeklyStats = () => {
      try {
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        
        // 获取本周日期范围（周一至周日）
        const today = dayjs()
        const startOfWeek = today.startOf('week').add(1, 'day') // 周一
        const endOfWeek = startOfWeek.add(6, 'day') // 周日
        
        console.log('本周日期范围:', startOfWeek.format('YYYY-MM-DD'), '至', endOfWeek.format('YYYY-MM-DD'))
        
        // 初始化周统计数据
        const weekData = {}
        weekDays.forEach((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          weekData[dayDate.format('YYYY-MM-DD')] = {
            day: day,
            date: dayDate,
            createdTasks: [],
            completedTasks: []
          }
        })
        
        // 遍历所有任务，按日期分类（与日历完全保持一致）
        todos.value.forEach(todo => {
          // 使用截止日期（due_date）来匹配日历的显示逻辑
          const dueDate = todo.due_date ? dayjs(todo.due_date).format('YYYY-MM-DD') : null
          const updatedDate = todo.updated_at ? dayjs(todo.updated_at).format('YYYY-MM-DD') : null
          
          // 如果任务截止日期在本周内，计入任务（与日历显示一致）
          if (dueDate && weekData[dueDate]) {
            weekData[dueDate].createdTasks.push(todo)
          }
          
          // 如果任务完成日期在本周内，计入完成任务
          if (todo.completed && updatedDate && weekData[updatedDate]) {
            weekData[updatedDate].completedTasks.push(todo)
          }
        })
        
        // 调试：显示每个日期的任务详情
        console.log('=== 详细任务分布 ===')
        weekDays.forEach((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          const dateKey = dayDate.format('YYYY-MM-DD')
          const dayData = weekData[dateKey]
          
          if (dayData.createdTasks.length > 0) {
            console.log(`
${day} (${dateKey}) 的任务:`)
            dayData.createdTasks.forEach((todo, i) => {
              console.log(`  ${i + 1}. ${todo.title}`)
              console.log(`     截止日期: ${todo.due_date}`)
              console.log(`     创建日期: ${todo.created_at}`)
              console.log(`     完成状态: ${todo.completed ? '已完成' : '未完成'}`)
            })
          }
        })
        
        // 生成最终统计结果
        weeklyStats.value = weekDays.map((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          const dateKey = dayDate.format('YYYY-MM-DD')
          const dayData = weekData[dateKey] || { createdTasks: [], completedTasks: [] }
          
          // 关键修复：只统计截止日期在该日的任务（与日历保持一致）
          const total = dayData.createdTasks.length
          // 只统计在该日完成的任务
          const completed = dayData.createdTasks.filter(todo => 
            todo.completed && todo.updated_at && 
            dayjs(todo.updated_at).format('YYYY-MM-DD') === dateKey
          ).length
          
          // 调试输出
          if (total > 0 || completed > 0) {
            console.log(`${day} (${dateKey}): 总任务${total}个, 当日完成${completed}个`)
            console.log('任务详情:', dayData.createdTasks.map(t => ({
              title: t.title,
              completed: t.completed,
              updated_at: t.updated_at
            })))
          }
          
          return {
            day: day,
            date: dayDate,
            completed: completed,
            total: total,
            completionRate: total > 0 ? (completed / total) * 100 : 0
          }
        })
        
        // 验证数据
        const totalCreated = weeklyStats.value.reduce((sum, day) => sum + day.total, 0)
        console.log('周统计验证: 总创建任务数 =', totalCreated)
        
      } catch (error) {
        console.error('计算周统计数据时出错:', error)
        // 返回默认数据
        weeklyStats.value = weekDays.map(day => ({
          day: day,
          date: dayjs(),
          completed: 0,
          total: 0,
          completionRate: 0
        }))
      }
    }

    onMounted(() => {
      loadTodos()
    })

    return {
      stats,
      weeklyStats,
      completionColor
    }
  }
}
</script>

<style scoped>
.statistics-container {
  min-height: 100vh;
  background: #f5f5f5;
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}



.back-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.stats-content {
  padding: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-card.total { border-left: 4px solid #667eea; }
.stat-card.completed { border-left: 4px solid #4CAF50; }
.stat-card.pending { border-left: 4px solid #FF9800; }
.stat-card.overdue { border-left: 4px solid #F44336; }

.stat-icon {
  font-size: 2rem;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.completion-section, .weekly-stats, .category-stats {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.completion-section h2, .weekly-stats h2, .category-stats h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.completion-chart {
  display: flex;
  align-items: center;
  gap: 30px;
  justify-content: center;
}

.progress-circle {
  position: relative;
}

.completion-info {
  text-align: left;
}

.completion-text {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.completion-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.completed { background: #4CAF50; }
.dot.pending { background: #FF9800; }

.week-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
}

.day-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-container {
  height: 150px;
  width: 30px;
  background: #f0f0f0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.completed-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #4CAF50;
  transition: height 0.3s ease;
}

.day-label {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #666;
}

.day-stats {
  font-size: 0.7rem;
  color: #999;
  margin-top: 4px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.category-icon {
  font-size: 2rem;
}

.category-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.category-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 0.9rem;
}

.category-progress {
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #667eea;
  transition: width 0.3s ease;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .completion-chart {
    flex-direction: column;
    text-align: center;
  }
  
  .week-chart {
    height: 150px;
  }
  
  .bar-container {
    height: 100px;
    width: 20px;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>