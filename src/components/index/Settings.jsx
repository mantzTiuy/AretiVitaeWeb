import React, { useState, useRef, useEffect } from "react";
import styles from "./modules/settings.module.css";

function Settings({ canvasReady }) {
  const [width, setWidth]             = useState("");
  const [height, setHeight]           = useState("");
  const [color, setColor]             = useState("#ffffff");
  const [colorStroke, setColorStroke] = useState("#efeeee");
  const selectedObjectRef             = useRef(null);

  const handleObjectSelection = (object) => {
    if (!object || object._isPort || object.isLine) return;
    selectedObjectRef.current = object;
    setWidth(Math.round(object.width  * object.scaleX));
    setHeight(Math.round(object.height * object.scaleY));

    if (object.type === "group") {
      const bg = object.getObjects().find((o) => o._isBackground);
      setColor(bg?.fill ?? "#ffffff");
      setColorStroke(object.stroke ?? "#efeeee");
    } else {
      setColor(object.fill   ?? "#ffffff");
      setColorStroke(object.stroke ?? "#efeeee");
    }
  };

  const clearSettings = () => {
    selectedObjectRef.current = null;
    setWidth("");
    setHeight("");
    setColor("#ffffff");
    setColorStroke("#cccccc");
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

  const MIN_SIZE = 50;
  const MAX_SIZE = 1500;
  const clamp = (val) => Math.min(Math.max(val, MIN_SIZE), MAX_SIZE);

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

    obj.set({ stroke: value });
    if (obj.type === "group") obj.dirty = true;
    canvas.requestRenderAll();
  };

  return (
    <div className={styles.div}>
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
    </div>
  );
}

export default Settings;