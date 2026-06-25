import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Clone } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import styles from './modules/BackButton.module.css'

const MODEL_PATH = '/models/PROJECTLOGOARETITHREEJS.glb'

function BackModel({ hovered }) {
  const { scene } = useGLTF(MODEL_PATH)
  const groupRef = useRef()
  const currentScale = useRef(1)

  const box = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  box.getCenter(center)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const baseScale = 1 / maxDim * 2

  scene.traverse((child) => {
    if (child.isMesh) {
      child.material.roughness = 0.9
      child.material.metalness = 0.0
      child.material.needsUpdate = true
      if (child.material.map) {
        child.material.map.colorSpace = THREE.SRGBColorSpace
      }
    }
  })

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (!hovered) groupRef.current.rotation.y += delta * 0.4
    const target = hovered ? baseScale * 1.15 : baseScale
    currentScale.current += (target - currentScale.current) * 0.1
    groupRef.current.scale.setScalar(currentScale.current)
  })

  return (
    <group ref={groupRef}>
      <Clone object={scene} deep position={[-center.x, -center.y, -center.z]} />
    </group>
  )
}

export default function BackButton() {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate('/home')}
    >
      <Canvas
        style={{ width: '72px', height: '72px', background: 'transparent', flexShrink: 0, marginTop: '6px', imageRendering: 'pixelated' }}
        camera={{ position: [0, 0, 3], fov: 40 }}
        dpr={0.4}
        gl={{
          antialias: false,
          alpha: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows
      >
        <ambientLight intensity={0.5} color="#f0f4ff" />
        <hemisphereLight skyColor="#f0f4ff" groundColor="#223344" intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" castShadow />

        <React.Suspense fallback={null}>
          <BackModel hovered={hovered} />
        </React.Suspense>
      </Canvas>

      <span className={`${styles.tooltip} ${hovered ? styles.tooltipVisible : styles.tooltipHidden}`}>
        Voltar para home
      </span>
    </div>
  )
}

useGLTF.preload(MODEL_PATH)