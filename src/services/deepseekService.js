import axios from 'axios'
import { DEEPSEEK_CONFIG, validateDeepSeekConfig } from '../config/deepseek.js'
import { AITaskProcessor } from './aiTaskProcessor.js'

class DeepSeekService {
  constructor() {
    this.client = axios.create({
      baseURL: DEEPSEEK_CONFIG.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      },
      timeout: 30000
    })
    
    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log('发送DeepSeek API请求:', config.url)
        return config
      },
      (error) => {
        console.error('DeepSeek请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )
    
    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        console.error('DeepSeek响应错误:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 发送消息到DeepSeek API或使用本地AI处理器
   * @param {string} message - 用户消息
   * @param {Array} history - 对话历史
   * @param {Object} options - 额外选项
   * @returns {Promise<string>} - AI回复
   */
  async sendMessage(message, history = [], options = {}) {
    try {
      // 首先尝试使用本地AI任务处理器处理
      const localResponse = await AITaskProcessor.processRequest(message)
      
      // 如果本地处理器返回了有效的回复（不是帮助信息），则使用本地回复
      if (localResponse && !localResponse.includes('请选择您需要的操作')) {
        return localResponse
      }
      
      // 本地处理器无法处理或返回帮助信息时，使用DeepSeek API
      // 验证配置
      if (!validateDeepSeekConfig()) {
        throw new Error('DeepSeek API配置不完整')
      }

      // 构建消息历史
      const messages = this.buildMessages(message, history)
      
      // 请求参数
      const params = {
        ...DEEPSEEK_CONFIG.defaultParams,
        ...options,
        model: options.model || DEEPSEEK_CONFIG.defaultModel,
        messages
      }

      const response = await this.client.post('/chat/completions', params)
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content
      } else {
        throw new Error('API响应格式异常')
      }
    } catch (error) {
      console.error('DeepSeek API调用失败:', error)
      
      // 根据错误类型返回友好提示
      if (error.response?.status === 401) {
        throw new Error('API密钥无效，请检查DeepSeek账户配置')
      } else if (error.response?.status === 402) {
        throw new Error('DeepSeek API需要付费，请检查账户余额或使用备用AI服务')
      } else if (error.response?.status === 429) {
        throw new Error('请求频率过高，请稍后重试')
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接')
      } else {
        // 返回模拟回复作为备用方案
        return this.getFallbackResponse(message)
      }
    }
  }

  /**
   * 构建消息格式
   * @param {string} message - 当前消息
   * @param {Array} history - 历史消息
   * @returns {Array} - 格式化后的消息数组
   */
  buildMessages(message, history) {
    const messages = []
    
    // 添加系统提示词，限制回答范围并明确功能权限
    messages.push({
      role: 'system',
      content: `🤖 **AI任务助手 - 专用系统提示**

## 核心功能权限

### 📋 任务查询
- 显示所有任务列表
- 查看待办/已完成/逾期/今日任务
- 获取任务统计信息

### ➕ 任务添加
- 创建新任务（支持自然语言）
- 智能识别日期、时间、优先级
- 自动提取任务标题

### ✏️ 任务编辑
- 修改任务标题、日期、时间
- 调整优先级设置

### 🗑️ 任务删除
- 删除指定任务
- 移除已完成任务

### 🔄 状态管理
- 标记任务为已完成
- 设为待办状态

### 🔍 任务搜索
- 按标题/日期/优先级搜索
- 智能关键词匹配

## 智能特性
- 支持中文自然语言理解
- 自动识别相对日期（明天、下周、下个月）
- 智能提取任务描述
- 优先级自动设置

## 重要限制
❌ **禁止回答范围**
- 技术问题（Vue.js/前端开发/JavaScript）
- 源代码或技术实现细节
- 与任务管理无关的内容

## 响应模板
对于超出范围的问题，请回复：
"抱歉，我是一个专门用于Todo任务管理的AI助手，只能回答与任务管理相关的问题。"

请专注于任务管理功能，提供专业、准确的帮助。`
    })
    
    // 添加历史消息
    history.forEach(item => {
      if (item.type === 'user') {
        messages.push({ role: 'user', content: item.text })
      } else if (item.type === 'ai') {
        messages.push({ role: 'assistant', content: item.text })
      }
    })
    
    // 添加当前消息
    messages.push({ role: 'user', content: message })
    
    return messages
  }

  /**
   * 获取可用模型列表
   * @returns {Promise<Array>}
   */
  async getModels() {
    try {
      const response = await this.client.get('/models')
      return response.data.data || []
    } catch (error) {
      console.error('获取模型列表失败:', error)
      return Object.values(DEEPSEEK_CONFIG.models)
    }
  }

  /**
   * 测试API连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      await this.sendMessage('你好', [])
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 获取备用回复（当API不可用时）
   * @param {string} message - 用户消息
   * @returns {string} - 模拟回复
   */
  getFallbackResponse(message) {
    const responses = [
      `收到您的消息："${message}"。目前DeepSeek API服务暂时不可用，建议检查API密钥配置或账户余额。`,
      `感谢您的提问："${message}"。AI服务正在维护中，请稍后重试或检查DeepSeek账户设置。`,
      `您的问题："${message}" 已收到。当前AI服务连接异常，建议：1) 检查API密钥 2) 验证账户状态 3) 稍后重试`,
      `关于"${message}"的问题，目前无法通过DeepSeek API获取回复。请确保API密钥有效且账户有足够余额。`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }
}

// 创建单例实例
export const deepSeekService = new DeepSeekService()

export default deepSeekService