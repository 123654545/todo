import axios from 'axios'
import { DEEPSEEK_CONFIG, validateDeepSeekConfig } from '../config/deepseek.js'

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
   * 发送消息到DeepSeek API
   * @param {string} message - 用户消息
   * @param {Array} history - 对话历史
   * @param {Object} options - 额外选项
   * @returns {Promise<string>} - AI回复
   */
  async sendMessage(message, history = [], options = {}) {
    try {
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