import React, { useMemo, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";

class IconErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("Falha ao carregar ícone 3D:", err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

function FallbackShape({ active }) {
  return (
    <mesh rotation={[0.4, 0.6, 0]}>
      <icosahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial
        color={active ? "#e8b768" : "#8fa4ff"}
        roughness={0.4}
        metalness={0.2}
        wireframe
      />
    </mesh>
  );
}

const FIT_RADIUS = 0.82;

const DEFAULT_ROTATION = [0.32, -0.55, 0];

function Model({ path, active, rotation }) {
  const { scene } = useGLTF(path);

  const { center, scale } = useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.roughness = 0.82;
        child.material.metalness = 0.3;
        child.material.needsUpdate = true;
        if (child.material.map) {
          child.material.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const c = new THREE.Vector3();
    box.getCenter(c);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const radius = sphere.radius || 1;

    return { center: c, scale: FIT_RADIUS / radius };
  }, [scene]);

  return (
    <group rotation={rotation} scale={scale}>
      <Clone object={scene} deep position={[-center.x, -center.y, -center.z]} />
    </group>
  );
}

export default function ModelIcon({ path, size = 38, active = false, rotation = DEFAULT_ROTATION }) {
  return (
    <Canvas
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        imageRendering: "pixelated",
      }}
      camera={{ position: [0, 0, 3], fov: 40 }}
      dpr={0.6}
      frameloop="demand"
      gl={{
        antialias: false,
        alpha: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
    >
      <ambientLight intensity={0.55} color={active ? "#c9a86a" : "#eef1ff"} />
      <hemisphereLight skyColor="#b9c8ff" groundColor="#191136" intensity={0.5} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={active ? 2.3 : 1.8}
        color={active ? "#f0d9a8" : "#ffffff"}
      />
      <pointLight position={[-3, -2, 2]} intensity={active ? 1.0 : 0.35} color="#8f7bff" />
      <React.Suspense fallback={<FallbackShape active={active} />}>
        <IconErrorBoundary fallback={<FallbackShape active={active} />}>
          <Model path={path} active={active} rotation={rotation} />
        </IconErrorBoundary>
      </React.Suspense>
    </Canvas>
  );
}