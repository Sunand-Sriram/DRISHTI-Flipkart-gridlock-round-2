import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

const NODES = [
  { pos: [-4, 2, -3] as const, geo: 'ico', color: '#14B8A6', scale: 0.6 },
  { pos: [5, -1, -4] as const, geo: 'oct', color: '#34D399', scale: 0.5 },
  { pos: [-2, -3, -2] as const, geo: 'dodec', color: '#FB7185', scale: 0.4 },
  { pos: [3, 3, -5] as const, geo: 'ico', color: '#38BDF8', scale: 0.35 },
  { pos: [-5, 0, -4] as const, geo: 'oct', color: '#14B8A6', scale: 0.45 },
  { pos: [1, -2, -3] as const, geo: 'dodec', color: '#F59E0B', scale: 0.3 },
  { pos: [4, 1, -2] as const, geo: 'ico', color: '#38BDF8', scale: 0.5 },
]

function NodeGeo({ geo }: { geo: string }) {
  switch (geo) {
    case 'oct': return <octahedronGeometry args={[1, 0]} />
    case 'dodec': return <dodecahedronGeometry args={[1, 0]} />
    default: return <icosahedronGeometry args={[1, 0]} />
  }
}

function FloatingNode({ pos, geo, color, scale }: typeof NODES[number]) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.12
      meshRef.current.rotation.z += delta * 0.08
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} position={[pos[0], pos[1], pos[2]]} scale={scale}>
        <NodeGeo geo={geo} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
    </Float>
  )
}

export function FloatingNodes() {
  return (
    <group>
      {NODES.map((node, i) => (
        <FloatingNode key={i} {...node} />
      ))}
    </group>
  )
}
