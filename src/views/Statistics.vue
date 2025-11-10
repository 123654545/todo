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

      <!-- 双图表统计 - 整合时间筛选器到统一区域 -->
      <div class="chart-container">
        <!-- 图表控制头部 -->
        <div class="chart-controls">
          <div class="chart-header">
            <h2>📊 双图表统计</h2>
            <span class="current-range-label">{{ currentStatsTitle }}</span>
          </div>
          
          <!-- 时间范围筛选器 -->
          <div class="time-filter-panel">
            <div class="time-filter-controls">
              <div class="time-range-selector">
                <label class="filter-label">图表时间范围：</label>
                <select v-model="selectedTimeRange" @change="handleTimeRangeChange" class="time-range-dropdown">
                  <option value="today">今天</option>
                  <option value="week" selected>本周</option>
                  <option value="month">本月</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              
              <!-- 自定义日期选择器（条件显示） -->
              <div v-if="selectedTimeRange === 'custom'" class="custom-date-picker">
                <label class="filter-label">自定义日期：</label>
                <div class="date-inputs">
                  <input type="date" v-model="customStartDate" class="date-input">
                  <span class="date-separator">至</span>
                  <input type="date" v-model="customEndDate" class="date-input">
                  <button @click="applyCustomRange" class="apply-btn">应用</button>
                </div>
              </div>
              
              <!-- 显示当前日期范围 -->
              <div class="date-range-display">
                <span class="range-text">当前范围：</span>
                <span class="range-value">{{ formatDateRange(currentStartDate, currentEndDate) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图表内容 -->
        <div class="chart-content">
        
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
                  :style="{ height: calculateBarHeight(day, 'created') + '%' }"
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
                  :style="{ height: calculateBarHeight(day, 'completed') + '%' }"
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
    
    // 时间范围相关状态
    const selectedTimeRange = ref('week') // 'today', 'week', 'month', 'custom'
    const customStartDate = ref('')
    const customEndDate = ref('')
    const currentStatsTitle = ref('本周任务统计')
    const currentStartDate = ref(dayjs().startOf('week').add(1, 'day')) // 周一
    const currentEndDate = ref(dayjs().startOf('week').add(7, 'day')) // 周日
    
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

    // 重构后的统计计算函数（支持时间范围）
    const calculateRangeStats = (startDate = null, endDate = null) => {
      // 如果没有传入时间范围，使用默认本周
      const today = dayjs()
      const startOfRange = startDate || today.startOf('week').add(1, 'day')
      const endOfRange = endDate || startOfRange.add(6, 'day')
      
      // 设置当前时间范围状态
      currentStartDate.value = startOfRange
      currentEndDate.value = endOfRange
      
      // 计算日期范围长度来确定标签格式
      const rangeDays = endOfRange.diff(startOfRange, 'day')
      
      // 根据范围长度设置标题
      if (rangeDays === 0) {
        currentStatsTitle.value = '今日任务统计'
      } else if (rangeDays <= 7) {
        currentStatsTitle.value = '本周任务统计'
      } else if (rangeDays <= 31) {
        currentStatsTitle.value = '本月任务统计'
      } else {
        currentStatsTitle.value = '自定义范围统计'
      }
      
      // 调用原有的统计逻辑，但使用过滤后的时间范围
      calculateStatsWithRange(startOfRange, endOfRange)
    }

    // 保持原有函数名兼容性
    const calculateWeeklyStats = () => {
      calculateRangeStats()
    }
    
    // 原有的统计逻辑，但支持时间范围过滤
    const calculateStatsWithRange = (startDate, endDate) => {
      try {
        // 动态生成日期标签
        const dateLabels = generateDateLabels(startDate, endDate)
        
        console.log('统计日期范围:', startDate.format('YYYY-MM-DD'), '至', endDate.format('YYYY-MM-DD'))
        
        // 初始化创建任务统计数据
        const createdData = {}
        // 初始化完成任务统计数据
        const completedData = {}
        
        // 生成日期范围内的所有日期
        const dateRange = []
        let currentDate = startDate.clone()
        
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
          dateRange.push(currentDate.clone())
          currentDate = currentDate.add(1, 'day')
        }
        
        // 初始化统计数据结构
        dateRange.forEach(date => {
          const dateKey = date.format('YYYY-MM-DD')
          const dayLabel = dateLabels[dateKey] || date.format('MM-DD')
          
          createdData[dateKey] = {
            day: dayLabel,
            date: date,
            created: 0,      // 创建任务数量
            completed: 0,    // 已完成任务数量
            pending: 0,      // 待完成任务数量
            tasks: []       // 该日创建的任务列表
          }
          
          completedData[dateKey] = {
            day: dayLabel,
            date: date,
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
        dateRange.forEach(date => {
          const dateKey = date.format('YYYY-MM-DD')
          
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
        weeklyCreatedStats.value = dateRange.map(date => {
          const dateKey = date.format('YYYY-MM-DD')
          const dayData = createdData[dateKey]
          
          return {
            day: dayData ? dayData.day : date.format('MM-DD'),
            date: date,
            created: dayData ? dayData.created : 0,
            completed: dayData ? dayData.completed : 0,
            pending: dayData ? dayData.pending : 0,
            completionRate: dayData ? dayData.completionRate : 0,
            tasks: dayData ? dayData.tasks : []
          }
        })
        
        weeklyCompletedStats.value = dateRange.map(date => {
          const dateKey = date.format('YYYY-MM-DD')
          const dayData = completedData[dateKey]
          
          return {
            day: dayData ? dayData.day : date.format('MM-DD'),
            date: date,
            completed: dayData ? dayData.completed : 0,
            total: dayData ? dayData.total : 0,
            completionRate: dayData && dayData.total > 0 ? 100 : 0,
            tasks: dayData ? dayData.tasks : [],
            status: dayData ? dayData.status : { onTime: 0, overdue: 0, early: 0 }
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
        // 动态生成日期标签
        const dateLabels = generateDateLabels(startDate, endDate)
        
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

    // 时间范围管理函数
    const handleTimeRangeChange = () => {
      // 重置自定义日期选择
      if (selectedTimeRange.value !== 'custom') {
        customStartDate.value = ''
        customEndDate.value = ''
      }
      
      // 计算新的时间范围
      calculateStatsByRange(selectedTimeRange.value)
    }
    
    const applyCustomRange = () => {
      if (!customStartDate.value || !customEndDate.value) {
        alert('请选择开始和结束日期')
        return
      }
      
      if (dayjs(customStartDate.value).isAfter(customEndDate.value)) {
        alert('开始日期不能晚于结束日期')
        return
      }
      
      calculateStatsByRange('custom', {
        start: customStartDate.value,
        end: customEndDate.value
      })
    }
    
    const calculateStatsByRange = (rangeType, customDates = null) => {
      let startDate, endDate, title
      
      switch (rangeType) {
        case 'today':
          startDate = dayjs().startOf('day')
          endDate = dayjs().endOf('day')
          title = '今日任务统计'
          break
        case 'week':
          startDate = dayjs().startOf('week').add(1, 'day') // 周一
          endDate = startDate.add(6, 'day') // 周日
          title = '本周任务统计'
          break
        case 'month':
          startDate = dayjs().startOf('month')
          endDate = dayjs().endOf('month')
          title = '本月任务统计'
          break
        case 'custom':
          startDate = dayjs(customDates.start)
          endDate = dayjs(customDates.end)
          title = '自定义范围统计'
          break
        default:
          // 默认本周
          startDate = dayjs().startOf('week').add(1, 'day')
          endDate = startDate.add(6, 'day')
          title = '本周任务统计'
      }
      
      // 更新当前时间范围状态
      currentStartDate.value = startDate
      currentEndDate.value = endDate
      currentStatsTitle.value = title
      
      // 重新计算统计
      calculateStatsWithRange(startDate, endDate)
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
    
    // 计算柱状图高度
    const calculateBarHeight = (day, type) => {
      if (type === 'created') {
        // 创建任务统计：使用创建任务数计算高度
        const maxCreated = Math.max(...weeklyCreatedStats.value.map(d => d.created), 1)
        return maxCreated > 0 ? (day.created / maxCreated) * 80 : 0
      } else {
        // 完成任务统计：使用完成任务数计算高度
        const maxCompleted = Math.max(...weeklyCompletedStats.value.map(d => d.completed), 1)
        return maxCompleted > 0 ? (day.completed / maxCompleted) * 80 : 0
      }
    }
    
    // 日期格式化函数
    const formatDateRange = (startDate, endDate) => {
      return `${startDate.format('YYYY年MM月DD日')} - ${endDate.format('YYYY年MM月DD日')}`
    }
    
    // 生成日期标签函数
    const generateDateLabels = (startDate, endDate) => {
      const labels = {}
      const rangeDays = endDate.diff(startDate, 'day')
      
      // 生成日期范围内的所有日期
      const dateRange = []
      let currentDate = startDate.clone()
      
      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        dateRange.push(currentDate.clone())
        currentDate = currentDate.add(1, 'day')
      }
      
      // 根据范围长度确定标签格式
      if (rangeDays <= 7) {
        // 一周内显示星期几
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        dateRange.forEach(date => {
          const dayOfWeek = date.day()
          labels[date.format('YYYY-MM-DD')] = weekDays[dayOfWeek]
        })
      } else if (rangeDays <= 31) {
        // 一个月内显示日期
        dateRange.forEach(date => {
          labels[date.format('YYYY-MM-DD')] = date.format('MM-DD')
        })
      } else {
        // 超过一个月显示月-日
        dateRange.forEach(date => {
          labels[date.format('YYYY-MM-DD')] = date.format('MM-DD')
        })
      }
      
      return labels
    }

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
      getMarkerType,
      selectedTimeRange,
      customStartDate,
      customEndDate,
      currentStatsTitle,
      currentStartDate,
      currentEndDate,
      handleTimeRangeChange,
      applyCustomRange,
      formatDateRange,
      calculateBarHeight
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
  margin-bottom: 50px;
  padding: 30px;
  border-radius: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stats-section:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stats-section:last-child {
  margin-bottom: 0;
}

/* 图表之间的分隔线 */
.stats-section:not(:last-child) {
  border-bottom: 3px solid #e8e8e8;
  padding-bottom: 40px;
}

/* 为两个图表区域添加不同的主题色 */
.stats-section:nth-child(1) {
  border-left: 4px solid #667eea;
}

.stats-section:nth-child(2) {
  border-left: 4px solid #4CAF50;
}

.section-title {
  margin: 0 0 25px 0;
  font-size: 1.3rem;
  color: #2c3e50;
  font-weight: 700;
  padding-bottom: 15px;
  border-bottom: 3px solid #ecf0f1;
  position: relative;
}

/* 为两个图表标题添加不同的主题色 */
.stats-section:nth-child(1) .section-title {
  border-bottom-color: #667eea;
}

.stats-section:nth-child(2) .section-title {
  border-bottom-color: #4CAF50;
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

/* 整合图表容器样式 */
.chart-container {
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* 图表控制头部 */
.chart-controls {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.current-range-label {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

/* 时间筛选面板 */
.time-filter-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  backdrop-filter: blur(10px);
}

.time-filter-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-label {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  min-width: 140px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.time-range-dropdown {
  padding: 10px 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #2d3748;
  cursor: pointer;
  min-width: 150px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.time-range-dropdown:focus {
  outline: none;
  border-color: white;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.custom-date-picker {
  display: flex;
  align-items: center;
  gap: 15px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  padding: 8px 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  color: #2d3748;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.date-input:focus {
  outline: none;
  border-color: white;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
}

.apply-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.apply-btn:hover {
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.date-range-display {
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 3px solid white;
}

.range-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.9rem;
}

.range-value {
  color: white;
  font-weight: 700;
  margin-left: 8px;
}

/* 图表内容区域 */
.chart-content {
  padding: 20px;
}

/* 日期范围标签 */
.date-range-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: -5px;
  margin-bottom: 20px;
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
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .time-range-selector {
    margin-right: 0;
    justify-content: space-between;
  }
  
  .custom-date-picker {
    flex-wrap: wrap;
  }
}
</style>