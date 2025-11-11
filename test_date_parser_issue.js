// 测试日期解析器问题
import { parseDateTime } from './src/utils/dateParser.js'

// 测试 "明天上午9点开会"
const testText = "明天上午9点开会"
console.log('🔍 测试文本:', testText)

const result = parseDateTime(testText)
console.log('📊 解析结果:')
console.log('  - 标题:', result.title)
console.log('  - 日期:', result.date)
console.log('  - 时间:', result.time)
console.log('  - 是否有日期:', result.hasDate)
console.log('  - 是否有时间:', result.hasTime)

// 测试日期解析器是否正常工作
const testCases = [
  "明天上午9点开会",
  "今天下午2点会议", 
  "后天晚上7点聚餐",
  "下周一下午3点汇报"
]

console.log('\n🧪 测试多个案例:')
testCases.forEach((text, index) => {
  const result = parseDateTime(text)
  console.log(`\n${index + 1}. "${text}"`)
  console.log('   标题:', result.title)
  console.log('   日期:', result.date)
  console.log('   时间:', result.time)
  console.log('   有日期:', result.hasDate)
  console.log('   有时间:', result.hasTime)
})