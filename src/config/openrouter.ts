import { z } from 'zod'

// OpenRouter model schemas
const OpenRouterModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextLength: z.number(),
  pricing: z.object({
    prompt: z.number(), // Price per 1M tokens
    completion: z.number()
  }),
  capabilities: z.array(z.string()),
  speed: z.enum(['fast', 'medium', 'slow']),
  quality: z.enum(['high', 'medium', 'low'])
})

type OpenRouterModel = z.infer<typeof OpenRouterModelSchema>

// Free premium models available on OpenRouter
export const FREE_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Experimental',
    contextLength: 1048576, // 1M context
    pricing: { prompt: 0, completion: 0 },
    capabilities: ['text', 'code', 'analysis'],
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B Instruct',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
    capabilities: ['text', 'code'],
    speed: 'fast',
    quality: 'medium'
  },
  {
    id: 'meta-llama/llama-3.2-1b-instruct:free',
    name: 'Llama 3.2 1B Instruct',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
    capabilities: ['text'],
    speed: 'fast',
    quality: 'low'
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct',
    contextLength: 32768,
    pricing: { prompt: 0, completion: 0 },
    capabilities: ['text', 'code'],
    speed: 'medium',
    quality: 'medium'
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct:free',
    name: 'Phi-3 Mini 128K',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
    capabilities: ['text', 'code'],
    speed: 'fast',
    quality: 'medium'
  },
  {
    id: 'qwen/qwen-2-7b-instruct:free',
    name: 'Qwen 2 7B Instruct',
    contextLength: 32768,
    pricing: { prompt: 0, completion: 0 },
    capabilities: ['text', 'code'],
    speed: 'medium',
    quality: 'medium'
  }
]

// Rate limiting configuration
export const RATE_LIMITS = {
  requestsPerMinute: 20,
  requestsPerDay: 1000,
  retryDelay: 1000, // ms
  maxRetries: 3,
  backoffMultiplier: 2
}

// OpenRouter API configuration
export const OPENROUTER_CONFIG = {
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  headers: {
    'HTTP-Referer': 'https://claude.directory',
    'X-Title': 'Claude Extensions Directory'
  }
}

// Model selection strategies
export class ModelSelector {
  private modelUsage: Map<string, { count: number; lastUsed: number }> = new Map()
  private lastRequestTime: number = 0
  private dailyRequests: number = 0
  private dailyResetTime: number = Date.now()

  /**
   * Select the best available model based on requirements
   */
  selectModel(requirements: {
    minContextLength?: number
    requiredCapabilities?: string[]
    preferredQuality?: 'high' | 'medium' | 'low'
    preferredSpeed?: 'fast' | 'medium' | 'slow'
  }): OpenRouterModel | null {
    // Reset daily counter if needed
    if (Date.now() - this.dailyResetTime > 24 * 60 * 60 * 1000) {
      this.dailyRequests = 0
      this.dailyResetTime = Date.now()
    }

    // Check daily limit
    if (this.dailyRequests >= RATE_LIMITS.requestsPerDay) {
      console.warn('Daily request limit reached')
      return null
    }

    // Filter models based on requirements
    let availableModels = [...FREE_MODELS]

    if (requirements.minContextLength) {
      availableModels = availableModels.filter(
        m => m.contextLength >= requirements.minContextLength!
      )
    }

    if (requirements.requiredCapabilities?.length) {
      availableModels = availableModels.filter(m =>
        requirements.requiredCapabilities!.every(cap => m.capabilities.includes(cap))
      )
    }

    if (requirements.preferredQuality) {
      // Sort by quality preference
      const qualityOrder = { high: 3, medium: 2, low: 1 }
      availableModels.sort((a, b) => 
        qualityOrder[b.quality] - qualityOrder[a.quality]
      )
    }

    if (requirements.preferredSpeed) {
      // Secondary sort by speed
      const speedOrder = { fast: 3, medium: 2, slow: 1 }
      availableModels.sort((a, b) => {
        const qualityDiff = a.quality === b.quality ? 0 : 1
        if (qualityDiff === 0) {
          return speedOrder[b.speed] - speedOrder[a.speed]
        }
        return 0
      })
    }

    // Select model with load balancing
    const selectedModel = this.loadBalance(availableModels)
    
    if (selectedModel) {
      this.trackUsage(selectedModel)
    }

    return selectedModel
  }

  /**
   * Load balance between available models
   */
  private loadBalance(models: OpenRouterModel[]): OpenRouterModel | null {
    if (models.length === 0) return null

    // Find least recently used model
    let selectedModel = models[0]
    let minUsageScore = Infinity

    for (const model of models) {
      const usage = this.modelUsage.get(model.id) || { count: 0, lastUsed: 0 }
      const usageScore = usage.count + (Date.now() - usage.lastUsed) / (1000 * 60) // Favor less used and older
      
      if (usageScore < minUsageScore) {
        minUsageScore = usageScore
        selectedModel = model
      }
    }

    return selectedModel
  }

  /**
   * Track model usage for load balancing
   */
  private trackUsage(model: OpenRouterModel) {
    const usage = this.modelUsage.get(model.id) || { count: 0, lastUsed: 0 }
    usage.count++
    usage.lastUsed = Date.now()
    this.modelUsage.set(model.id, usage)
    this.dailyRequests++
    this.lastRequestTime = Date.now()
  }

  /**
   * Check if we should rate limit
   */
  shouldRateLimit(): boolean {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    const minInterval = 60000 / RATE_LIMITS.requestsPerMinute // ms between requests
    return timeSinceLastRequest < minInterval
  }

  /**
   * Get rate limit delay in ms
   */
  getRateLimitDelay(): number {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    const minInterval = 60000 / RATE_LIMITS.requestsPerMinute
    return Math.max(0, minInterval - timeSinceLastRequest)
  }
}

// Fallback model selection
export function getFallbackModels(): OpenRouterModel[] {
  // Return models in order of preference for fallback
  return [
    FREE_MODELS.find(m => m.id === 'google/gemini-2.0-flash-exp:free')!,
    FREE_MODELS.find(m => m.id === 'mistralai/mistral-7b-instruct:free')!,
    FREE_MODELS.find(m => m.id === 'meta-llama/llama-3.2-3b-instruct:free')!,
  ].filter(Boolean)
}

// OpenRouter API client
export class OpenRouterClient {
  private apiKey: string
  private modelSelector: ModelSelector

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.modelSelector = new ModelSelector()
  }

  /**
   * Make a completion request to OpenRouter
   */
  async complete(params: {
    messages: Array<{ role: string; content: string }>
    temperature?: number
    maxTokens?: number
    requirements?: Parameters<ModelSelector['selectModel']>[0]
  }): Promise<{ content: string; model: string } | null> {
    // Check rate limiting
    if (this.modelSelector.shouldRateLimit()) {
      const delay = this.modelSelector.getRateLimitDelay()
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Select model
    const model = this.modelSelector.selectModel(params.requirements || {})
    if (!model) {
      console.error('No suitable model available')
      return null
    }

    // Try primary model with fallbacks
    const fallbackModels = getFallbackModels()
    const modelsToTry = [model, ...fallbackModels.filter(m => m.id !== model.id)]

    for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
      const currentModel = modelsToTry[attempt]
      
      try {
        const response = await this.makeRequest(currentModel, params)
        if (response) return response
      } catch (error) {
        console.error(`Error with model ${currentModel.id}:`, error)
        
        // If it's the last model, throw
        if (attempt === modelsToTry.length - 1) {
          throw error
        }
        
        // Otherwise, try next model
        console.log(`Falling back to next model...`)
      }
    }

    return null
  }

  /**
   * Make actual API request
   */
  private async makeRequest(
    model: OpenRouterModel,
    params: {
      messages: Array<{ role: string; content: string }>
      temperature?: number
      maxTokens?: number
    }
  ): Promise<{ content: string; model: string }> {
    const response = await fetch(OPENROUTER_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...OPENROUTER_CONFIG.headers
      },
      body: JSON.stringify({
        model: model.id,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 4000,
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0].message.content,
      model: model.id
    }
  }
}

// Export singleton instance
let clientInstance: OpenRouterClient | null = null

export function getOpenRouterClient(apiKey: string): OpenRouterClient {
  if (!clientInstance || clientInstance['apiKey'] !== apiKey) {
    clientInstance = new OpenRouterClient(apiKey)
  }
  return clientInstance
}