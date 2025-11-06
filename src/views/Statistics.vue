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

      <!-- 双图表周统计 -->
      <div class="weekly-stats">
        <h2>本周任务统计</h2>
        
        <!-- 创建任务统计 -->
        <div class="stats-section">
          <h3 class="section-title">📋 创建任务统计（按创建日期）</h3>
          <div class="week-chart created-chart">
            <div 
              v-for="day in weeklyCreatedStats" 
              :key="'created-' + day.day"
              class="day-bar"
              @mouseenter="debouncedShowCreatedTooltip(day, $event)"
              @mouseleave="hideTooltip"
            >
              <div class="bar-container">
                <div 
                  class="completed-bar created-bar" 
                  :style="{ height: day.completionRate + '%' }"
                ></div>
                <!-- 任务状态标记点 -->
                <div 
                  v-if="day.pending > 0"
                  class="status-marker pending-marker"
                  :style="{ bottom: getMarkerPosition(day) + '%' }"
                ></div>
                <div 
                  v-if="day.completed > 0"
                  class="status-marker completed-marker"
                  :style="{ bottom: getMarkerPosition(day) + '%' }"
                ></div>
              </div>
              <span class="day-label">{{ day.day }}</span>
              <span class="day-stats">{{ day.created }} 个</span>
            </div>
          </div>
        </div>

        <!-- 完成任务统计 -->
        <div class="stats-section">
          <h3 class="section-title">✅ 完成任务统计（按完成日期）</h3>
          <div class="week-chart completed-chart">
            <div 
              v-for="day in weeklyCompletedStats" 
              :key="'completed-' + day.day"
              class="day-bar"
              @mouseenter="debouncedShowCompletedTooltip(day, $event)"
              @mouseleave="hideTooltip"
            >
              <div class="bar-container">
                <div 
                  class="completed-bar completed-bar" 
                  :style="{ height: day.completionRate + '%' }"
                ></div>
                <!-- 任务状态标记点 -->
                <div 
                  v-if="day.status.early > 0"
                  class="status-marker early-marker"
                  :style="{ bottom: getMarkerPosition(day) + '%' }"
                ></div>
                <div 
                  v-if="day.status.overdue > 0"
                  class="status-marker overdue-marker"
                  :style="{ bottom: getMarkerPosition(day) + '%' }"
                ></div>
                <div 
                  v-if="day.status.onTime > 0"
                  class="status-marker ontime-marker"
                  :style="{ bottom: getMarkerPosition(day) + '%' }"
                ></div>
              </div>
              <span class="day-label">{{ day.day }}</span>
              <span class="day-stats">{{ day.completed }} 个</span>
            </div>
          </div>
        </div>

        <!-- 动态提示框 -->
        <div 
          v-if="activeTooltip"
          class="tooltip"
          :style="{ 
            left: tooltipPosition.x + 'px', 
            top: tooltipPosition.y + 'px' 
          }"
        >
          <div class="tooltip-content">
            <h4>{{ activeTooltip.day }} 任务统计</h4>
            
            <template v-if="activeTooltipType === 'created'">
              <!-- 创建任务统计详情 -->
              <div class="tooltip-section">
                <span class="tooltip-label">创建任务：</span>
                <span class="tooltip-value">{{ activeTooltip.created }} 个</span>
              </div>
              
              <div class="tooltip-section">
                <span class="tooltip-label">已完成：</span>
                <span class="tooltip-value">{{ activeTooltip.completed }} 个</span>
              </div>
              
              <div class="tooltip-section">
                <span class="tooltip-label">待完成：</span>
                <span class="tooltip-value">{{ activeTooltip.pending }} 个</span>
              </div>
              
              <div class="tooltip-section">
                <span class="tooltip-label">完成率：</span>
                <span class="tooltip-value">{{ Math.round(activeTooltip.completionRate) }}%</span>
              </div>
            </template>

            <template v-if="activeTooltipType === 'completed'">
              <!-- 完成任务统计详情 -->
              <div class="tooltip-section">
                <span class="tooltip-label">完成任务：</span>
                <span class="tooltip-value">{{ activeTooltip.completed }} 个</span>
              </div>
              
              <!-- 任务状态分类 -->
              <div v-if="activeTooltip.status.early > 0" class="tooltip-highlight">
                <div class="highlight-icon">🚀</div>
                <div class="highlight-text">
                  <strong>提前完成：{{ activeTooltip.status.early }} 个</strong>
                  <small>效率优秀！提前完成计划任务</small>
                </div>
              </div>
              
              <div v-if="activeTooltip.status.onTime > 0" class="tooltip-highlight">
                <div class="highlight-icon">✅</div>
                <div class="highlight-text">
                  <strong>按时完成：{{ activeTooltip.status.onTime }} 个</strong>
                  <small>按计划完成任务</small>
                </div>
              </div>
              
              <div v-if="activeTooltip.status.overdue > 0" class="tooltip-highlight">
                <div class="highlight-icon">⚠️</div>
                <div class="highlight-text">
                  <strong>逾期完成：{{ activeTooltip.status.overdue }} 个</strong>
                  <small>超过截止日期完成</small>
                </div>
              </div>
            </template>
            
            <!-- 统计说明 -->
            <div class="tooltip-section">
              <small class="tooltip-note">
                {{ activeTooltipType === 'created' ? '📊 按创建日期统计' : '📊 按完成日期统计' }}
              </small>
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

    // 双图表统计数据
    const weeklyCreatedStats = ref([]) // 创建任务统计
    const weeklyCompletedStats = ref([]) // 完成任务统计
    const categoryStats = ref([])
    
    // 动态提示相关状态
    const activeTooltip = ref(null)
    const tooltipPosition = ref({ x: 0, y: 0 })
    const activeTooltipType = ref('') // 'created' 或 'completed'
    
    // 防抖函数
    const debounce = (func, wait) => {
      let timeout
      return function executedFunction(...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          func(...args)
        }, wait)
      }
    }

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

    // 双图表统计：创建任务统计 + 完成任务统计
    const calculateWeeklyStats = () => {
      try {
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        
        // 获取本周日期范围（周一至周日）
        const today = dayjs()
        const startOfWeek = today.startOf('week').add(1, 'day') // 周一
        
        console.log('本周日期范围:', startOfWeek.format('YYYY-MM-DD'), '至', startOfWeek.add(6, 'day').format('YYYY-MM-DD'))
        
        // 初始化创建任务统计数据
        const createdData = {}
        // 初始化完成任务统计数据
        const completedData = {}
        
        weekDays.forEach((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          const dateKey = dayDate.format('YYYY-MM-DD')
          
          createdData[dateKey] = {
            day: day,
            date: dayDate,
            created: 0,      // 创建任务数量
            completed: 0,    // 已完成任务数量
            pending: 0,      // 待完成任务数量
            tasks: []       // 该日创建的任务列表
          }
          
          completedData[dateKey] = {
            day: day,
            date: dayDate,
            completed: 0,    // 该日完成的任务数量
            total: 0,        // 该日完成的总任务数
            tasks: [],       // 该日完成的任务列表
            // 任务状态分类
            status: {
              onTime: 0,     // 按时完成
              overdue: 0,     // 逾期完成
              early: 0        // 提前完成
            }
          }
        })
        
        // 遍历所有任务进行分类统计
        todos.value.forEach(todo => {
          const createdDate = dayjs(todo.created_at).format('YYYY-MM-DD')
          const completedDate = todo.completed && todo.updated_at 
            ? dayjs(todo.updated_at).format('YYYY-MM-DD') 
            : null
          
          // 1. 创建任务统计（按创建日期）
          if (createdData[createdDate]) {
            createdData[createdDate].created++
            createdData[createdDate].tasks.push(todo)
            
            if (todo.completed) {
              createdData[createdDate].completed++
            } else {
              createdData[createdDate].pending++
            }
          }
          
          // 2. 完成任务统计（按完成日期）
          if (completedDate && completedData[completedDate]) {
            completedData[completedDate].completed++
            completedData[completedDate].tasks.push(todo)
            
            // 判断任务状态
            if (todo.due_date) {
              const dueDate = dayjs(todo.due_date)
              const actualDate = dayjs(todo.updated_at)
              
              if (actualDate.isBefore(dueDate, 'day')) {
                completedData[completedDate].status.early++
              } else if (actualDate.isAfter(dueDate, 'day')) {
                completedData[completedDate].status.overdue++
              } else {
                completedData[completedDate].status.onTime++
              }
            } else {
              // 无截止日期的任务默认为按时完成
              completedData[completedDate].status.onTime++
            }
          }
        })
        
        // 计算完成率等统计指标
        weekDays.forEach((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          const dateKey = dayDate.format('YYYY-MM-DD')
          
          // 创建任务统计：计算完成率
          const createdDay = createdData[dateKey]
          createdDay.completionRate = createdDay.created > 0 
            ? (createdDay.completed / createdDay.created) * 100 
            : 0
            
          // 完成任务统计：设置总数
          const completedDay = completedData[dateKey]
          completedDay.total = completedDay.completed
        })
        
        // 生成最终统计结果
        weeklyCreatedStats.value = weekDays.map((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          const dateKey = dayDate.format('YYYY-MM-DD')
          const dayData = createdData[dateKey]
          
          return {
            day: day,
            date: dayDate,
            created: dayData.created,
            completed: dayData.completed,
            pending: dayData.pending,
            completionRate: dayData.completionRate,
            tasks: dayData.tasks
          }
        })
        
        weeklyCompletedStats.value = weekDays.map((day, index) => {
          const dayDate = startOfWeek.add(index, 'day')
          const dateKey = dayDate.format('YYYY-MM-DD')
          const dayData = completedData[dateKey]
          
          return {
            day: day,
            date: dayDate,
            completed: dayData.completed,
            total: dayData.total,
            completionRate: dayData.total > 0 ? 100 : 0, // 完成任务统计完成率总是100%
            tasks: dayData.tasks,
            status: dayData.status
          }
        })
        
        // 验证数据
        const totalCreated = weeklyCreatedStats.value.reduce((sum, day) => sum + day.created, 0)
        const totalCompleted = weeklyCompletedStats.value.reduce((sum, day) => sum + day.completed, 0)
        
        console.log('双图表统计验证:')
        console.log('创建任务总数:', totalCreated)
        console.log('完成任务总数:', totalCompleted)
        console.log('实际任务总数:', todos.value.length)
        
      } catch (error) {
        console.error('计算周统计数据时出错:', error)
        // 返回默认数据
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        
        weeklyCreatedStats.value = weekDays.map(day => ({
          day: day,
          date: dayjs(),
          created: 0,
          completed: 0,
          pending: 0,
          completionRate: 0,
          tasks: []
        }))
        
        weeklyCompletedStats.value = weekDays.map(day => ({
          day: day,
          date: dayjs(),
          completed: 0,
          total: 0,
          completionRate: 0,
          tasks: [],
          status: { onTime: 0, overdue: 0, early: 0 }
        }))
      }
    }
    
    // 计算优化信息
    const calculateOptimizationInfo = (tasks, dayDate) => {
      const completedToday = tasks.filter(todo => 
        todo.completed && dayjs(todo.updated_at).isSame(dayDate, 'day')
      ).length
      
      const earlyCompletion = tasks.filter(todo => 
        todo.completed && todo.due_date && 
        dayjs(todo.updated_at).isBefore(dayjs(todo.due_date), 'day')
      ).length
      
      // 计算效率（完成率加权）
      const efficiency = tasks.length > 0 ? (completedToday / tasks.length) * 100 : 0
      
      return {
        completedToday: completedToday,
        earlyCompletion: earlyCompletion,
        efficiency: Math.round(efficiency)
      }
    }

    // 动态提示函数
    const showTooltip = (day, event) => {
      activeTooltip.value = day
      
      // 计算提示框位置，确保在可视区域内
      const tooltipWidth = 260
      const tooltipHeight = 200
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let x = event.clientX + 10
      let y = event.clientY + 10
      
      // 检查右边界
      if (x + tooltipWidth > viewportWidth) {
        x = event.clientX - tooltipWidth - 10
      }
      
      // 检查下边界
      if (y + tooltipHeight > viewportHeight) {
        y = event.clientY - tooltipHeight - 10
      }
      
      // 确保位置不为负值
      x = Math.max(10, x)
      y = Math.max(10, y)
      
      tooltipPosition.value = { x, y }
    }

    const hideTooltip = () => {
      activeTooltip.value = null
    }

    // 标记点位置计算
    const getMarkerPosition = (day) => {
      // 标记点位置基于完成率，但要确保在柱状图内
      const basePosition = 100 - day.completionRate
      return Math.max(5, Math.min(95, basePosition))
    }

    // 标记点类型判断
    const getMarkerType = (day) => {
      if (day.optimization.efficiency >= 90) return 'excellent'
      if (day.optimization.efficiency >= 70) return 'good'
      return 'normal'
    }

    // 创建任务提示函数
    const showCreatedTooltip = (day, event) => {
      activeTooltip.value = day
      activeTooltipType.value = 'created'
      
      // 计算提示框位置
      const tooltipWidth = 280
      const tooltipHeight = 220
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let x = event.clientX + 10
      let y = event.clientY + 10
      
      // 检查右边界
      if (x + tooltipWidth > viewportWidth) {
        x = event.clientX - tooltipWidth - 10
      }
      
      // 检查下边界
      if (y + tooltipHeight > viewportHeight) {
        y = event.clientY - tooltipHeight - 10
      }
      
      // 确保位置不为负值
      x = Math.max(10, x)
      y = Math.max(10, y)
      
      tooltipPosition.value = { x, y }
    }

    // 完成任务提示函数
    const showCompletedTooltip = (day, event) => {
      activeTooltip.value = day
      activeTooltipType.value = 'completed'
      
      // 计算提示框位置
      const tooltipWidth = 280
      const tooltipHeight = 220
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let x = event.clientX + 10
      let y = event.clientY + 10
      
      // 检查右边界
      if (x + tooltipWidth > viewportWidth) {
        x = event.clientX - tooltipWidth - 10
      }
      
      // 检查下边界
      if (y + tooltipHeight > viewportHeight) {
        y = event.clientY - tooltipHeight - 10
      }
      
      // 确保位置不为负值
      x = Math.max(10, x)
      y = Math.max(10, y)
      
      tooltipPosition.value = { x, y }
    }

    // 创建防抖版本的提示函数 (50ms防抖)
    const debouncedShowCreatedTooltip = debounce(showCreatedTooltip, 50)
    const debouncedShowCompletedTooltip = debounce(showCompletedTooltip, 50)

    onMounted(() => {
      loadTodos()
    })

    return {
      stats,
      weeklyCreatedStats,
      weeklyCompletedStats,
      completionColor,
      activeTooltip,
      activeTooltipType,
      tooltipPosition,
      debouncedShowCreatedTooltip,
      debouncedShowCompletedTooltip,
      hideTooltip,
      getMarkerPosition,
      getMarkerType
    }
  }
}
</script>

<style scoped>
.statistics-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
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

/* 双图表样式 */
.stats-section {
  margin-bottom: 30px;
}

.stats-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #444;
  font-weight: 600;
}

/* 不同颜色的柱状图 */
.created-chart .completed-bar {
  background: linear-gradient(to top, #667eea, #764ba2);
}

.completed-chart .completed-bar {
  background: linear-gradient(to top, #4CAF50, #45a049);
}

/* 状态标记点 */
.status-marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 10;
}

.pending-marker { background: #FF9800; }
.completed-marker { background: #4CAF50; }
.early-marker { background: #4CAF50; }
.ontime-marker { background: #2196F3; }
.overdue-marker { background: #F44336; }

/* 双图表样式 */
.stats-section {
  margin-bottom: 30px;
}

.stats-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #444;
  font-weight: 600;
}

/* 不同颜色的柱状图 */
.created-chart .completed-bar {
  background: linear-gradient(to top, #667eea, #764ba2);
}

.completed-chart .completed-bar {
  background: linear-gradient(to top, #4CAF50, #45a049);
}

/* 状态标记点 */
.status-marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 10;
}

.pending-marker { background: #FF9800; }
.completed-marker { background: #4CAF50; }
.early-marker { background: #4CAF50; }
.ontime-marker { background: #2196F3; }
.overdue-marker { background: #F44336; }

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
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  min-height: 200px;
  overflow: hidden;
  position: relative;
}

.day-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 0 auto;
  min-width: 40px;
  max-width: 60px;
  position: relative;
  transition: transform 0.15s ease-out;
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

/* 优化标记点样式 */
.optimization-marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 10;
  transition: all 0.3s ease;
}

.optimization-marker.excellent {
  background: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

.optimization-marker.good {
  background: #FF9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.3);
}

.optimization-marker.normal {
  background: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
}

/* 悬停效果增强 */
.day-bar:hover {
  transform: translateY(-2px);
  transition: transform 0.15s ease-out;
}

.day-bar:hover .optimization-marker {
  transform: translateX(-50%) scale(1.3);
}

/* 防止悬停时的布局抖动 */
.day-bar:hover .bar-container,
.day-bar:hover .completed-bar {
  transform: none; /* 防止柱状图自身变化 */
  transition: none;
}

/* 提示框样式 */
.tooltip {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  min-width: 260px;
  max-width: 300px;
  border: 1px solid #e2e8f0;
  animation: tooltipFadeIn 0.2s ease-out;
  pointer-events: none; /* 防止提示框干扰鼠标事件 */
  will-change: transform; /* 优化动画性能 */
}

@keyframes tooltipFadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.tooltip-content h4 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 14px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
}

.tooltip-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
  font-size: 13px;
}

.tooltip-label {
  color: #64748b;
  font-weight: 500;
}

.tooltip-value {
  color: #1e293b;
  font-weight: 600;
}

/* 高亮提示区域 */
.tooltip-highlight {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  margin: 12px -4px;
  border-left: 3px solid #4CAF50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tooltip-highlight .highlight-icon {
  font-size: 16px;
}

.tooltip-highlight .highlight-text {
  flex: 1;
}

.tooltip-highlight strong {
  color: #1e293b;
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
}

.tooltip-highlight small {
  color: #64748b;
  font-size: 11px;
}

.tooltip-note {
  color: #94a3b8;
  font-style: italic;
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