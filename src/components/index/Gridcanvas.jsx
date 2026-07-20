import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const GRID_SIZE  = 40; 
const BG_COLOR   = "#cce6fe";
const LINE_COLOR = "#89bce8";

// Expõe `redraw(viewportTransform, zoom)` via ref para o Index.jsx chamar
const GridCanvas = forwardRef(function GridCanvas(_, ref) {
  const canvasRef = useRef(null);

  const draw = (vpt, zoom) => {
    const gc = canvasRef.current;
    if (!gc || !vpt) return;
    const ctx = gc.getContext("2d");
    const w   = gc.width;
    const h   = gc.height;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const step    = GRID_SIZE * zoom;
    const offsetX = vpt[4] % step;
    const offsetY = vpt[5] % step;

    ctx.save();
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth   = 1;
    ctx.globalAlpha = 0.6;

    for (let x = offsetX; x < w + step; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = offsetY; y < h + step; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.restore();
  };

  // Resize interno
  useEffect(() => {
    const gc = canvasRef.current;
    if (!gc) return;
    const onResize = () => {
      gc.width  = window.innerWidth;
      gc.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // API exposta ao pai via ref
  useImperativeHandle(ref, () => ({
    redraw: (vpt, zoom) => draw(vpt, zoom),
    resize: () => {
      const gc = canvasRef.current;
      if (!gc) return;
      gc.width  = window.innerWidth;
      gc.height = window.innerHeight;
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position:      "absolute",
        top:           0,
        left:          0,
        zIndex:        0,
        pointerEvents: "none",
      }}
    />
  );
});

export default GridCanvas;