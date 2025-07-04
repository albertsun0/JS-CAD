import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Chat from './components/Chat'
import ModelViewer from './components/ModelViewer'
import ProviderStatus from './components/ProviderStatus'
import { ChatMessage, GeneratedModel } from './types'
import { useLLM } from './hooks/useLLM'
import './App.css'

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentModel, setCurrentModel] = useState<GeneratedModel | null>(null)
  const { generateModel, isLoading, providerInfo } = useLLM()

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Use the LLM hook for model generation
      const response = await generateModel({ prompt: content })
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.explanation || 'Generated JSCAD model',
        timestamp: new Date(),
      }

      const newModel: GeneratedModel = {
        id: Date.now().toString(),
        name: `Model ${Date.now()}`,
        code: response.code,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setCurrentModel(newModel)
    } catch (error) {
      console.error('Error generating model:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the model.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [10, 10, 10], fov: 50 }}
          className="bg-gray-800"
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <OrbitControls enablePan enableZoom enableRotate />
          <Grid infiniteGrid fadeDistance={50} fadeStrength={0.5} />
          <ModelViewer model={currentModel} />
        </Canvas>
        
        {/* Model Info Overlay */}
        {currentModel && (
          <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg">
            <h3 className="text-lg font-semibold">{currentModel.name}</h3>
            <p className="text-sm text-gray-300">
              Generated: {currentModel.timestamp.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Provider Status Overlay */}
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg">
          <ProviderStatus
            provider={providerInfo.provider}
            hasApiKey={providerInfo.hasApiKey}
            model={providerInfo.model}
          />
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-96 bg-gray-800 border-l border-gray-700">
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}



export default App 