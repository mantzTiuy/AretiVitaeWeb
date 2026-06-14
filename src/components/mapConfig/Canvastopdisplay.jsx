import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import styles from './modules/createCanvas.module.css';

export default function CanvasTopDisplay() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (mount.childElementCount > 0) return;

    const width  = mount.clientWidth;
    const height = mount.clientHeight;

    // ── SCENE ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x01172F);

    // ── CAMERA ──
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    // ── RENDERER ──
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    mount.appendChild(renderer.domElement);

    // ── LIGHTS ──
    scene.add(new THREE.AmbientLight(0xd0e8ff, 1.2));

    const rimLight = new THREE.DirectionalLight(0x8ab4ff, 1.5);
    rimLight.position.set(6, -4, -10);
    scene.add(rimLight);

    // ── STARS (instanced icosahedra, same as reference) ──
    const starCount = 2026;
    const geo = new THREE.IcosahedronGeometry(0.1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.3,
    });
    const stars  = new THREE.InstancedMesh(geo, mat, starCount);
    const dummy  = new THREE.Object3D();
    const minD   = 10;
    const maxD   = 55;

    for (let i = 0; i < starCount; i++) {
      let x, y, z, d;
      do {
        x = (Math.random() - 0.5) * 160;
        y = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 160;
        d = Math.sqrt(x * x + y * y + z * z);
      } while (d < minD || d > maxD);

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }

    // ── EXTRA CLOSE STARS — populate the "empty" foreground ──
    const closeCount = 300;
    const geoS = new THREE.IcosahedronGeometry(0.055, 0);
    const matS = new THREE.MeshStandardMaterial({
      color: 0xc8d8ff,
      emissive: 0xc8d8ff,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.2,
    });
    const starsClose = new THREE.InstancedMesh(geoS, matS, closeCount);
    const dummyS = new THREE.Object3D();

    for (let i = 0; i < closeCount; i++) {
      dummyS.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40
      );
      dummyS.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummyS.updateMatrix();
      starsClose.setMatrixAt(i, dummyS.matrix);
    }

    // ── NEBULA POINTS — soft coloured haze ──
    const nebulaCount = 600;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaColors    = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount; i++) {
      nebulaPositions[i * 3]     = (Math.random() - 0.5) * 120;
      nebulaPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      nebulaPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      const t = Math.random();
      nebulaColors[i * 3]     = 0.3 + t * 0.3;
      nebulaColors[i * 3 + 1] = 0.4 + t * 0.2;
      nebulaColors[i * 3 + 2] = 0.7 + t * 0.3;
    }
    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeo.setAttribute('color',    new THREE.BufferAttribute(nebulaColors, 3));
    const nebulaMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);

    // ── GROUP ──
    const starsGroup = new THREE.Group();
    starsGroup.add(stars);
    starsGroup.add(starsClose);
    starsGroup.add(nebula);
    scene.add(starsGroup);

    // ── RESIZE ──
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── ANIMATE ──
    const clock = new THREE.Clock();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      starsGroup.rotation.y += delta * 0.012;
      starsGroup.rotation.x += delta * 0.004;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      geoS.dispose();
      matS.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={styles.display} />;
}