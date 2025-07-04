import { useState, useEffect } from 'react'
import { LLMRequest, LLMResponse } from '../types'
import { LLMService } from '../services/llmService'

export function useLLM() {
  const [isLoading, setIsLoading] = useState(false)
  const [llmService] = useState(() => new LLMService())
  const [providerInfo, setProviderInfo] = useState(llmService.getProviderInfo())

  useEffect(() => {
    setProviderInfo(llmService.getProviderInfo())
  }, [llmService])

  const generateModel = async (request: LLMRequest): Promise<LLMResponse> => {
    setIsLoading(true)

    try {
      const response = await llmService.generateModel(request.prompt)
      return response
    } catch (error) {
      console.error('Error generating model:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    generateModel,
    isLoading,
    providerInfo
  }
}

