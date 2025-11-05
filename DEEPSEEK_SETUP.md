# DeepSeek AI 对话集成配置指南

## 概述

本项目已成功集成 DeepSeek 大模型，为您的待办应用提供智能对话功能。AI助手可以帮助用户管理任务、提供建议和回答问题。

## 配置步骤

### 1. 获取 DeepSeek API 密钥

1. 访问 [DeepSeek 官网](https://www.deepseek.com)
2. 注册账号并登录
3. 进入 API 管理页面
4. 创建新的 API 密钥
5. 复制生成的 API 密钥

### 2. 配置环境变量

打开 `.env.local` 文件，将您的 API 密钥填入相应位置：

```env
# DeepSeek API 配置
VITE_DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

**重要提示：**
- 将 `your_actual_deepseek_api_key_here` 替换为您的真实 API 密钥
- 确保密钥格式正确，不要包含额外的空格或引号

### 3. 验证配置

配置完成后，重启开发服务器：

```bash
npm run dev
```

打开应用，点击右下角的 AI 对话按钮测试功能。

## 功能特性

### ✅ 已实现功能

- **智能对话**: 基于 DeepSeek 大模型的自然语言对话
- **上下文记忆**: 保持对话历史，提供连贯的交流体验
- **加载状态**: 显示 AI 思考中的动画效果
- **错误处理**: 友好的错误提示和重试机制
- **响应式设计**: 适配桌面和移动设备

### 🎯 使用场景

1. **任务管理帮助**
   - "帮我创建一个明天上午9点的会议提醒"
   - "如何高效管理每日任务？"

2. **问题解答**
   - "什么是番茄工作法？"
   - "如何提高工作效率？"

3. **智能建议**
   - "根据我的任务历史，有什么改进建议？"

## 技术架构

### 核心文件

- `src/config/deepseek.js` - DeepSeek API 配置
- `src/services/deepseekService.js` - API 服务层
- `src/components/AIChatButton.vue` - AI 对话界面组件

### API 集成

项目使用标准的 OpenAI 兼容接口：

```javascript
// 请求示例
{
  model: "deepseek-chat",
  messages: [
    { role: "user", content: "你好" }
  ],
  temperature: 0.7,
  max_tokens: 1024
}
```

## 故障排除

### 常见问题

**1. API 密钥无效**
- 症状："API密钥无效，请检查配置"
- 解决方案：检查 API 密钥是否正确，确保有足够的额度

**2. 网络连接问题**
- 症状："请求超时，请检查网络连接"
- 解决方案：检查网络连接，或稍后重试

**3. 频率限制**
- 症状："请求频率过高，请稍后重试"
- 解决方案：等待一段时间后重试

### 调试方法

1. 打开浏览器开发者工具
2. 查看 Network 标签页中的 API 请求
3. 检查 Console 标签页中的错误信息

## 安全注意事项

1. **保护 API 密钥**
   - 不要将 `.env.local` 文件提交到版本控制
   - 在生产环境中使用环境变量管理密钥

2. **数据隐私**
   - 对话内容会发送到 DeepSeek 服务器
   - 避免发送敏感个人信息

## 扩展开发

### 自定义模型

可以在 `src/config/deepseek.js` 中配置不同的模型：

```javascript
models: {
  'deepseek-chat': {
    name: 'DeepSeek Chat',
    description: '通用对话模型',
    maxTokens: 4096
  },
  'deepseek-coder': {
    name: 'DeepSeek Coder', 
    description: '代码生成专用模型',
    maxTokens: 4096
  }
}
```

### 添加功能

可以扩展 AI 助手的功能：

1. **任务操作集成**: 允许 AI 直接操作待办事项
2. **语音交互**: 集成语音输入输出
3. **多语言支持**: 支持多种语言对话

## 支持与反馈

如遇到问题或需要帮助，请：

1. 检查本配置指南
2. 查看浏览器控制台错误信息
3. 联系技术支持

---

**祝您使用愉快！** 🚀