// 调试日期解析问题
import { smartParseTodo } from './src/utils/dateParser.js'

// 测试用例
const testCases = [
  '今天开会',
  '明天上午9点开会',
  '后天下午的培训',
  '大后天工作任务'
]

async function debugDateParsing() {
  console.log('🔍 调试日期解析问题：\n')
  
  for (const testCase of testCases) {
    console.log(`输入: "${testCase}"`)
    try {
      const result = await smartParseTodo(testCase)
      console.log('✅ 解析结果:')
      console.log('- 标题:', result.title)
      console.log('- 日期:', result.dueDate)
      console.log('- 时间:', result.dueTime || '无')
      console.log('- 优先级:', result.priority)
      console.log('- 有日期:', result.hasDate)
      console.log('- 有时间:', result.hasTime)
      console.log('---')
    } catch (error) {
      console.log(`❌ 解析失败: ${error.message}`)
      console.log('---')
    }
  }
}

debugDateParsing()