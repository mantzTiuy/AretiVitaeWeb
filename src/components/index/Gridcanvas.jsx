import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { DEFAULT_GRID_BG_COLOR, DEFAULT_GRID_LINE_COLOR } from "./constants";

const GRID_SIZE = 40;


const GridCanvas = forwardRef(function GridCanvas(
  { bgColor = DEFAULT_GRID_BG_COLOR, lineColor = DEFAULT_GRID_LINE_COLOR },
  ref
) {
  const canvasRef = useRef(null);

  const lastTransformRef = useRef(null);

  const draw = (vpt, zoom) => {
    const gc = canvasRef.current;
    if (!gc || !vpt) return;
    lastTransformRef.current = { vpt, zoom };

    const ctx = gc.getContext("2d");
    const w = gc.width;
    const h = gc.height;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const step    = GRID_SIZE * zoom;
    const offsetX = vpt[4] % step;
    const offsetY = vpt[5] % step;

    ctx.save();
    ctx.strokeStyle = lineColor;
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


  useEffect(() => {
    if (lastTransformRef.current) {
      draw(lastTransformRef.current.vpt, lastTransformRef.current.zoom);
    }

  }, [bgColor, lineColor]);


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