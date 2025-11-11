// 测试AI任务处理器的逻辑
const { AITaskProcessor } = require('./src/services/aiTaskProcessor.js');

// 测试用例
const testCases = [
  '修改会议时间',
  '会议时间改为明天', 
  '修改明天的会议时间',
  '添加会议任务',
  '明天开会',
  '删除会议任务'
];

console.log('=== AI任务处理器逻辑测试 ===\n');

for (const testCase of testCases) {
  console.log(`输入: "${testCase}"`);
  
  // 测试编辑请求判断
  const isEditRequest = AITaskProcessor.isEditRequest(testCase);
  console.log(`  编辑请求: ${isEditRequest}`);
  
  // 测试添加请求判断
  const isAddRequest = AITaskProcessor.isAddRequest(testCase);
  console.log(`  添加请求: ${isAddRequest}`);
  
  // 测试查找任务标题
  const mockTasks = [
    { id: '1', title: '项目会议', completed: false, dueDate: '2024-01-15', priority: 'medium' },
    { id: '2', title: '周会', completed: false, dueDate: '2024-01-16', priority: 'high' }
  ];
  const foundTask = AITaskProcessor.findTaskByTitle(testCase, mockTasks);
  console.log(`  找到任务: ${foundTask ? foundTask.title : '无'}`);
  
  console.log('');
}