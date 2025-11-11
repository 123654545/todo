// 测试AI助手的时间识别功能
import { AITaskProcessor } from './src/services/aiTaskProcessor.js'

async function testAITimeRecognition() {
  console.log('🧪 测试AI助手时间识别功能\n')
  
  // 测试用例
  const testCases = [
    // 添加任务测试
    { input: '3小时后开会', description: '相对时间 - 几小时后' },
    { input: '2天后提交报告', description: '相对时间 - 几天后' },
    { input: '1周后项目评审', description: '相对时间 - 几周后' },
    { input: '下周一上午10点会议', description: '复杂时间组合' },
    { input: '月底提交预算', description: '特殊时间表达式' },
    { input: '明天下午3点健身', description: '简单时间组合' },
    
    // 编辑任务测试
    { input: '修改会议时间为3小时后', description: '编辑相对时间' },
    { input: '将会议改到后天上午', description: '编辑复杂时间' },
    { input: '调整项目时间为下周五', description: '编辑星期时间' },
  ]
  
  for (const testCase of testCases) {
    console.log(`📝 测试用例: ${testCase.input}`)
    console.log(`📋 描述: ${testCase.description}`)
    
    try {
      // 测试添加请求识别
      const isAdd = AITaskProcessor.isAddRequest(testCase.input)
      console.log(`✅ 添加请求识别: ${isAdd}`)
      
      // 测试编辑请求识别
      const isEdit = AITaskProcessor.isEditRequest(testCase.input)
      console.log(`✅ 编辑请求识别: ${isEdit}`)
      
      // 测试任务信息解析
      const taskInfo = await AITaskProcessor.parseTaskInfo(testCase.input)
      console.log(`📅 解析结果:`)
      console.log(`  标题: ${taskInfo.title}`)
      console.log(`  日期: ${taskInfo.dueDate || '未设置'}`)
      console.log(`  时间: ${taskInfo.dueTime || '未设置'}`)
      console.log(`  优先级: ${taskInfo.priority}`)
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`)
    }
    
    console.log('---\n')
  }
}

// 运行测试
async function runTests() {
  try {
    await testAITimeRecognition()
    console.log('🎉 所有测试完成！')
  } catch (error) {
    console.error('❌ 测试执行失败:', error)
  }
}

runTests()