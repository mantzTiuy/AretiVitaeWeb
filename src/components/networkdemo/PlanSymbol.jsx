import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";
import styles from "./modules/PlanSymbol.module.css";

const FRONT_ROTATION_Y = Math.PI / 2;

function PlanSymbolScene({ model, hovered, scaleMultiplier }) {
  const { scene } = useGLTF(model);
  const groupRef = useRef();

  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const baseScale = (1 / Math.max(size.x, size.y, size.z)) * 3.9 * scaleMultiplier;

  useFrame((_, delta) => {
    if (groupRef.current && hovered) {
      groupRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group
      ref={groupRef}
      scale={baseScale}
      position={[0, 0, 0]}
      rotation={[0, FRONT_ROTATION_Y, 0]}
    >
      <Clone object={scene} deep position={[-center.x, -center.y, -center.z]} />
    </group>
  );
}

export default function PlanSymbol({ model, scaleMultiplier = 1 }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.container}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Canvas
        className={styles.canvas}
        style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
        camera={{ position: [0, 0, 4.2], fov: 40 }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={2.2} color="#c7dbf6" />
        <directionalLight position={[2, 4, 6]} intensity={3.5} color="#ffffff" />
        <directionalLight position={[-2, 2, -2]} intensity={1.8} color="#cce0ff" />
        <directionalLight position={[0, -3, 4]} intensity={1.2} color="#ffffff" />
        <Suspense fallback={null}>
          <PlanSymbolScene model={model} hovered={hovered} scaleMultiplier={scaleMultiplier} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hecate.glb");
useGLTF.preload("/models/artemis.glb");
 useGLTF.preload("/models/selene.glb");