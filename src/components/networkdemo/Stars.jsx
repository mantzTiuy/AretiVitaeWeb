// Stars.jsx
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

const STAR_COUNT = 2026
const MIN_DIST = 55
const MAX_DIST = 70

export default function Stars() {
  const { scene } = useThree()

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(0.055, 5, 5)
    const material = new THREE.MeshStandardMaterial({
      color: 0xc8d8ff,
      emissive: 0x8aabff,
      emissiveIntensity: 1.4,
      roughness: 0.3,
      metalness: 0.0,
    })

    const mesh = new THREE.InstancedMesh(geometry, material, STAR_COUNT)
    const dummy = new THREE.Object3D()

    for (let i = 0; i < STAR_COUNT; i++) {
      let x, y, z, dist
      do {
        x = (Math.random() - 0.5) * 200
        y = (Math.random() - 0.5) * 100
        z = (Math.random() - 0.5) * 200
        dist = Math.sqrt(x * x + y * y + z * z)
      } while (dist < MIN_DIST || dist > MAX_DIST)

      dummy.position.set(x, y, z)
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )
      dummy.scale.setScalar(0.5 + Math.random() * 1.5)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    scene.add(mesh)

    return () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    }
  }, [scene])

  return null
}