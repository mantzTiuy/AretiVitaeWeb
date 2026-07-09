import { useEffect, useRef } from "react";
import styles from "./modules/mapSpecs.module.css";

const STAR_COUNT = 4200;
const starData = Array.from({ length: STAR_COUNT }, () => ({
  x:       Math.random(),
  y:       Math.random(),
  r:       Math.random() * 0.8 + 0.2,
  opacity: Math.random() * 0.6 + 0.3,
}));

export default function CanvasStarBackground() {
  const canvasRef = useRef(null);
  const angleRef  = useRef(0);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let last     = performance.now();

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now) => {
      const delta = now - last;
      last = now;
      angleRef.current += delta * 0.00004;

      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = "#01172F";
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;
      const nebula = ctx.createRadialGradient(
        cx, cy * 0.6, 0,
        cx, cy,       Math.max(W, H) * 0.7
      );
      nebula.addColorStop(0,   "rgba(60, 80, 160, 0.18)");
      nebula.addColorStop(0.5, "rgba(30, 40, 100, 0.08)");
      nebula.addColorStop(1,   "rgba(0,   0,   0,  0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, W, H);

      const cos = Math.cos(angleRef.current);
      const sin = Math.sin(angleRef.current);
      const scale = W / 1440;

      // multiplicador maior = estrelas espalhadas por uma área bem maior que a tela,
      // então mesmo girando não ficam concentradas/repetidas perto do centro
      const SPREAD = 2.4;

      for (const star of starData) {
        const wx = (star.x - 0.5) * W * SPREAD;
        const wy = (star.y - 0.5) * H * SPREAD;
        const sx = cx + wx * cos - wy * sin;
        const sy = cy + wx * sin + wy * cos;

        ctx.beginPath();
        ctx.arc(sx, sy, star.r * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}