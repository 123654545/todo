// 测试今天的识别功能
import { smartParseTodo } from './src/utils/dateParser.js'

// 测试用例
const testCases = [
  '今天开会',
  '今天的会议', 
  '今天上午9点开会',
  '今日工作任务',
  '今天下午的培训',
  '今天晚餐约会'
]

async function testTodayRecognition() {
  console.log('🔍 测试"今天"识别功能：\n')
  
  for (const testCase of testCases) {
    console.log(`输入: "${testCase}"`)
    try {
      const result = await smartParseTodo(testCase)
      console.log(`✅ 解析结果:`)
      console.log(`   标题: "${result.title}"`)
      console.log(`   日期: ${result.dueDate}`)
      console.log(`   时间: ${result.dueTime || '无'}`)
      console.log(`   优先级: ${result.priority}`)
      console.log('---')
    } catch (error) {
      console.log(`❌ 解析失败: ${error.message}`)
      console.log('---')
    }
  }
}

testTodayRecognition()