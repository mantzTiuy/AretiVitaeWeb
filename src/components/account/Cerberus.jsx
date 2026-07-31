import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";

const AVATAR_MODEL =
  Math.random() < 0.01//Cerberus pode vir de mãozinha levantada a depender do modelo
    ? "/models/cerberus.glb"
    : "/models/cerberuspose.glb";

function CerberusScene() {
  const { scene } = useGLTF(AVATAR_MODEL); //UseGLTF facilita salvar modelos
  const groupRef = useRef();

  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const baseScale = (1 / Math.max(size.x, size.y, size.z)) * 2.8;//Calculos que posicionam a caixa

  useFrame((_, delta) => { //Executa a função a cada frame renderizado
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;//Gira no próprio eixo
    }
  });

  return (
    <group ref={groupRef} scale={baseScale} position={[0, -0.15, 0]}>
      <Clone object={scene} deep position={[-center.x, -center.y, -center.z]} />{/*é uma caixa com várias informações a respeito do modelo */}
    </group>
  );
}

useGLTF.preload("/models/cerberus.glb");
useGLTF.preload("/models/cerberuspose.glb");

export default function Cerberus({ size = 50, style = {} }) {
  return (
    <div 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "#5c71ab",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      {/*Não tire o css inline, para poder passar size mais fácil */}
      <Canvas
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
        camera={{ position: [0, 0, 3.8], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.4} color="#c7dbf6" />
        <directionalLight position={[2, 4, 6]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-2, 2, -2]} intensity={1.0} color="#cce0ff" /> {/*Mil fita */}
        <Suspense fallback={null}>{/*Pausa a renderização enquanto ainda não estão prontos, a evitar problemas como o modelo carregado sem as luzes ou sem textura */}
          <CerberusScene />
        </Suspense>
      </Canvas>
    </div>
  );
}