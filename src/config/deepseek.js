// DeepSeek API 配置
export const DEEPSEEK_CONFIG = {
  // 通过环境变量配置API密钥
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  
  // DeepSeek API基础URL
  baseURL: 'https://api.deepseek.com/v1',
  
  // 默认模型配置
  defaultModel: 'deepseek-chat',
  
  // 模型选项
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
  },
  
  // 默认请求参数
  defaultParams: {
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 0.95,
    stream: false
  }
}

// 验证配置
export const validateDeepSeekConfig = () => {
  if (!DEEPSEEK_CONFIG.apiKey) {
    console.warn('DeepSeek API密钥未配置，请设置VITE_DEEPSEEK_API_KEY环境变量')
    return false
  }
  return true
}