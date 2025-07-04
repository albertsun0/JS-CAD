import { Settings, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { LLMProvider } from '../services/llmService'

interface ProviderStatusProps {
  provider: LLMProvider
  hasApiKey: boolean
  model: string
}

export default function ProviderStatus({ provider, hasApiKey, model }: ProviderStatusProps) {
  const getProviderIcon = () => {
    switch (provider) {
      case 'openai':
        return '🤖'
      case 'anthropic':
        return '🔮'
      case 'google':
        return '🌟'
      default:
        return '⚡'
    }
  }

  const getProviderName = () => {
    switch (provider) {
      case 'openai':
        return 'OpenAI'
      case 'anthropic':
        return 'Anthropic Claude'
      case 'google':
        return 'Google Gemini'
      default:
        return 'Simulation'
    }
  }

  const getStatusColor = () => {
    if (provider === 'simulation') return 'text-yellow-400'
    return hasApiKey ? 'text-green-400' : 'text-red-400'
  }

  const getStatusIcon = () => {
    if (provider === 'simulation') return <Zap className="w-4 h-4" />
    return hasApiKey ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (provider === 'simulation') return 'Simulation Mode'
    return hasApiKey ? 'Connected' : 'API Key Missing'
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-lg">{getProviderIcon()}</span>
      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          <span className="text-gray-300">{getProviderName()}</span>
          <span className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-xs">{getStatusText()}</span>
          </span>
        </div>
        <div className="text-xs text-gray-400">
          Model: {model}
        </div>
      </div>
      
      {!hasApiKey && provider !== 'simulation' && (
        <div className="ml-2">
          <Settings className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  )
} 