import { parseDateTime } from './src/utils/dateParser.js';
import dayjs from 'dayjs';

async function debugDateIssue() {
  const testText = "明天上午9点开会";
  
  console.log('🔍 测试文本:', testText);
  
  // 步骤1: 测试日期解析器
  const parsedResult = parseDateTime(testText);
  console.log('📊 解析结果:', JSON.stringify(parsedResult, null, 2));
  
  // 步骤2: 模拟任务创建流程
  const taskData = {
    title: parsedResult.title,
    dueDate: parsedResult.date,
    dueTime: parsedResult.time
  };
  
  console.log('📝 任务数据:', JSON.stringify(taskData, null, 2));
  
  // 步骤3: 检查日期显示逻辑
  const formatDate = (date) => {
    if (!date) return '';
    const taskDate = dayjs(date);
    const today = dayjs();
    
    if (taskDate.year() === today.year()) {
      return taskDate.format('MM月DD日');
    } else {
      return taskDate.format('YYYY年MM月DD日');
    }
  };
  
  console.log('📅 格式化后的日期:', formatDate(taskData.dueDate));
  console.log('❓ 是否有日期:', !!taskData.dueDate);
  
  // 步骤4: 检查显示逻辑
  console.log('📋 显示逻辑判断:');
  console.log('- todo.dueDate 存在:', !!taskData.dueDate);
  console.log('- todo.dueDate 不为空:', taskData.dueDate && taskData.dueDate.trim() !== '');
  console.log('- 应该显示日期吗:', taskData.dueDate && taskData.dueDate.trim() !== '');
}

debugDateIssue();