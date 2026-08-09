import React, { useState, useRef, useEffect } from "react";
import styles from "./modules/settings.module.css";

// Limites de espessura de linha (independentes dos limites de bloco em
// constants.js, já que a escala visual é bem diferente).
const MIN_LINE_WIDTH = 1;
const MAX_LINE_WIDTH = 20;

function Settings({ canvasReady }) {
  const [width, setWidth]             = useState("");
  const [height, setHeight]           = useState("");
  const [color, setColor]             = useState("#ffffff");
  const [colorStroke, setColorStroke] = useState("#efeeee");

  // ── Estado específico de conexões (linhas) ──────────────────────────────
  const [isLine, setIsLine]           = useState(false);
  const [lineColor, setLineColor]     = useState("#ffffff");
  const [lineWidth, setLineWidth]     = useState(4);

  const selectedObjectRef             = useRef(null);

  const handleObjectSelection = (object) => {
    if (!object || object._isPort) return;
    selectedObjectRef.current = object;

    // Conexão selecionada: mostra só os controles de cor/espessura da linha
    if (object.isLine) {
      setIsLine(true);
      setLineColor(object.stroke ?? "#ffffff");
      setLineWidth(Math.round(object.strokeWidth ?? 4));
      return;
    }

    setIsLine(false);
    setWidth(Math.round(object.width  * object.scaleX));
    setHeight(Math.round(object.height * object.scaleY));

    if (object.type === "group") {
      const bg = object.getObjects().find((o) => o._isBackground);
      setColor(bg?.fill ?? "#ffffff");
      // A borda "real" de um group (blocos normais ou cards de mídia)
      // fica no Rect filho marcado _isBackground, não no stroke do
      // próprio group — por isso lemos daí primeiro.
      setColorStroke(bg?.stroke ?? object.stroke ?? "#efeeee");
    } else {
      setColor(object.fill   ?? "#ffffff");
      setColorStroke(object.stroke ?? "#efeeee");
    }
  };

  const clearSettings = () => {
    selectedObjectRef.current = null;
    setIsLine(false);
    setWidth("");
    setHeight("");
    setColor("#ffffff");
    setColorStroke("#cccccc");
    setLineColor("#ffffff");
    setLineWidth(4);
  };

  // Após qualquer mudança dimensional, atualiza coords e dispara modified
  // para que Index.jsx atualize linhas e portas corretamente.
  const commitResize = () => {
    const canvas = canvasReady;
    const obj    = selectedObjectRef.current;
    if (!canvas || !obj) return;
    obj.setCoords();
    canvas.fire("object:modified", { target: obj });
    canvas.requestRenderAll();
  };

  useEffect(() => {
    const canvas = canvasReady;
    if (!canvas) return;

    const onCreated = (e) => handleObjectSelection(e.selected?.[0]);
    const onUpdated = (e) => handleObjectSelection(e.selected?.[0]);
    const onCleared = ()  => clearSettings();

    canvas.on("selection:created", onCreated);
    canvas.on("selection:updated", onUpdated);
    canvas.on("selection:cleared", onCleared);

    return () => {
      canvas.off("selection:created", onCreated);
      canvas.off("selection:updated", onUpdated);
      canvas.off("selection:cleared", onCleared);
    };
  }, [canvasReady]);

  // Mantido em sincronia com MIN_SIZE/MAX_SIZE de constants.js (mapEditor)
  const MIN_SIZE = 30;
  const MAX_SIZE = 1500;
  const clamp = (val) => Math.min(Math.max(val, MIN_SIZE), MAX_SIZE);
  const clampLineWidth = (val) => Math.min(Math.max(val, MIN_LINE_WIDTH), MAX_LINE_WIDTH);

  // ── Width ──
  const handleWidthChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const raw = parseInt(e.target.value, 10);
    setWidth(isNaN(raw) ? "" : raw);
    const obj = selectedObjectRef.current;
    if (!obj || isNaN(raw) || raw <= 0) return;

    const val = clamp(raw);
    if (val !== raw) setWidth(val);

    if (obj.type === "group" || obj.type === "rect") {
      obj.set({ scaleX: val / obj.width });
    } else if (obj.type === "textbox") {
      obj.set({ width: val });
    }
    commitResize();
  };

  // ── Height ──
  const handleHeightChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const raw = parseInt(e.target.value, 10);
    setHeight(isNaN(raw) ? "" : raw);
    const obj = selectedObjectRef.current;
    if (!obj || isNaN(raw) || raw <= 0) return;

    const val = clamp(raw);
    if (val !== raw) setHeight(val);

    if (obj.type === "group" || obj.type === "rect") {
      obj.set({ scaleY: val / obj.height });
    }
    commitResize();
  };

  // ── Fill color ──
  const handleColorChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const value = e.target.value;
    setColor(value);
    const obj = selectedObjectRef.current;
    if (!obj) return;

    if (obj.type === "group") {
      obj.getObjects().forEach((child) => {
        if (child._isBackground) child.set({ fill: value });
      });
      obj.dirty = true;
    } else {
      obj.set({ fill: value });
    }
    canvas.requestRenderAll();
  };

  // ── Stroke color ──
  const handleStrokeColorChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const value = e.target.value;
    setColorStroke(value);
    const obj = selectedObjectRef.current;
    if (!obj) return;

    if (obj.type === "group") {
      // Mesma lógica do fill: a borda visível de um group (inclusive
      // os cards de mídia/PDF vindos do useMediaImporter) está no Rect
      // filho _isBackground, então é nele que o stroke precisa ser
      // aplicado para ter efeito visual.
      const bg = obj.getObjects().find((o) => o._isBackground);
      if (bg) {
        bg.set({ stroke: value });
      } else {
        obj.set({ stroke: value });
      }
      obj.dirty = true;
    } else {
      obj.set({ stroke: value });
    }
    canvas.requestRenderAll();
  };

  // ── Connection (line) color ──
  const handleLineColorChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const value = e.target.value;
    setLineColor(value);
    const obj = selectedObjectRef.current;
    if (!obj || !obj.isLine) return;

    obj.set({ stroke: value });
    canvas.requestRenderAll();
  };

  // ── Connection (line) width ──
  const handleLineWidthChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const raw = parseInt(e.target.value, 10);
    setLineWidth(isNaN(raw) ? "" : raw);
    const obj = selectedObjectRef.current;
    if (!obj || !obj.isLine || isNaN(raw)) return;

    const val = clampLineWidth(raw);
    if (val !== raw) setLineWidth(val);

    obj.set({ strokeWidth: val });
    canvas.requestRenderAll();
  };

  return (
    <div className={styles.div}>
      {isLine ? (
        <>
          <label className={styles.label}>Espessura</label>
          <input
            type="number"
            min={MIN_LINE_WIDTH}
            max={MAX_LINE_WIDTH}
            value={lineWidth}
            onChange={handleLineWidthChange}
            className={styles.input1}
          />
          <label className={styles.label}>Cor</label>
          <input
            type="color"
            value={lineColor}
            onChange={handleLineColorChange}
            className={styles.inputColor}
          />
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="W"
            onChange={handleWidthChange}
            value={width}
            className={styles.input1}
          />
          <input
            type="text"
            placeholder="H"
            value={height}
            onChange={handleHeightChange}
            className={styles.input2}
          />
          <label className={styles.label}>Fill</label>
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            className={styles.inputColor}
          />
          <label className={styles.label}>Stroke</label>
          <input
            type="color"
            value={colorStroke}
            onChange={handleStrokeColorChange}
            className={styles.inputColor}
          />
        </>
      )}
    </div>
  );
}

export default Settings;