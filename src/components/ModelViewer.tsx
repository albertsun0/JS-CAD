import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { GeneratedModel } from '../types'
import { executeJSCAD } from '../utils/jscadExecutor'

interface ModelViewerProps {
  model: GeneratedModel | null
}

function ModelMesh({ geometry }: { geometry: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  if (!geometry) return null

  // Determine if we should use wireframe for very complex models
  const vertexCount = geometry.attributes?.position?.count || 0
  const useWireframe = vertexCount > 3000

  return (
    <mesh ref={meshRef}>
      <bufferGeometry {...geometry} />
      <meshStandardMaterial 
        color="#4f9eff" 
        wireframe={useWireframe}
        transparent={useWireframe}
        opacity={useWireframe ? 0.8 : 1.0}
      />
    </mesh>
  )
}

export default function ModelViewer({ model }: ModelViewerProps) {
  const [geometry, setGeometry] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!model) {
      setGeometry(null)
      setError(null)
      return
    }

    const loadModel = async () => {
      try {
        setError(null)
        const result = await executeJSCAD(model.code)
        setGeometry(result)
      } catch (err) {
        console.error('Error executing JSCAD:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setGeometry(null)
      }
    }

    loadModel()
  }, [model])

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
    )
  }

  if (!model || !geometry) {
    return (
      <mesh>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    )
  }

  return <ModelMesh geometry={geometry} />
} 