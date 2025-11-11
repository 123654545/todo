// 测试日期识别功能
import { smartParseTodo } from './src/utils/dateParser.js'

// 测试用例
const testCases = [
  "今天开会",
  "今天的会议", 
  "今天上午9点开会",
  "后天培训",
  "后天的培训",
  "后天下午2点培训",
  "大后天检查",
  "大后天上午10点检查",
  "明天约会",
  "明天晚上7点约会"
]

console.log("📅 日期识别测试结果：\n")

for (const testCase of testCases) {
  try {
    const result = await smartParseTodo(testCase)
    console.log(`输入: "${testCase}"`)
    console.log(`  标题: "${result.title}"`)
    console.log(`  日期: ${result.dueDate || '无'}`)
    console.log(`  时间: ${result.dueTime || '无'}`)
    console.log(`  优先级: ${result.priority}`)
    console.log("-".repeat(40))
  } catch (error) {
    console.error(`测试失败: ${testCase}`, error)
  }
}