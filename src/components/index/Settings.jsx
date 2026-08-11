import React, { useState, useRef, useEffect } from "react";
import styles from "./modules/settings.module.css";
import FontSelector from "./FontSelector";
import CharCounter from "./CharCounter";
import { loadGoogleFont } from "./loadGoogleFont";
import {
  CONTAINER_MIN_WIDTH,
  CONTAINER_MIN_HEIGHT,
  CONTAINER_MAX_WIDTH,
  CONTAINER_MAX_HEIGHT,
  CONTAINER_LABEL_MAX_LENGTH,
} from "./constants";
import { OUTLINE_EXTRA_WIDTH } from "./usePortsAndConnections";


const MIN_LINE_WIDTH = 1;
const MAX_LINE_WIDTH = 20;

function Settings({ canvasReady }) {
  const [width, setWidth]             = useState("");
  const [height, setHeight]           = useState("");
  const [color, setColor]             = useState("#ffffff");
  const [colorStroke, setColorStroke] = useState("#efeeee");

  const [isLine, setIsLine]           = useState(false);
  const [lineColor, setLineColor]     = useState("#ffffff");
  const [lineWidth, setLineWidth]     = useState(4);


  const [isTextObject, setIsTextObject] = useState(false);
  const [fontFamily, setFontFamily]     = useState("Josefin Sans");


  const [isContainer, setIsContainer]     = useState(false);
  const [containerName, setContainerName] = useState("");

  const selectedObjectRef             = useRef(null);

  const handleObjectSelection = (object) => {
    if (!object || object._isPort) return;
    selectedObjectRef.current = object;

    if (object.isLine) {
      setIsLine(true);
      setIsTextObject(false);
      setIsContainer(false);
      setLineColor(object.stroke ?? "#ffffff");
      setLineWidth(Math.round(object.strokeWidth ?? 4));
      return;
    }

    setIsLine(false);

   
    const isContainerObj = object._blockType === "container";
    setIsContainer(isContainerObj);
    setContainerName(isContainerObj ? (object._linkedLabel?.text ?? "") : "");

    const isTextbox = object.type === "textbox";
    setIsTextObject(isTextbox);
    if (isTextbox) setFontFamily(object.fontFamily || "Josefin Sans");

    setWidth(Math.round(object.width  * object.scaleX));
    setHeight(Math.round(object.height * object.scaleY));

    if (object.type === "group") {
      const bg = object.getObjects().find((o) => o._isBackground);
      setColor(bg?.fill ?? "#ffffff");
  
      setColorStroke(bg?.stroke ?? object.stroke ?? "#efeeee");
    } else {
      setColor(object.fill   ?? "#ffffff");
      setColorStroke(object.stroke ?? "#efeeee");
    }
  };

  const clearSettings = () => {
    selectedObjectRef.current = null;
    setIsLine(false);
    setIsTextObject(false);
    setIsContainer(false);
    setContainerName("");
    setWidth("");
    setHeight("");
    setColor("#ffffff");
    setColorStroke("#cccccc");
    setLineColor("#ffffff");
    setLineWidth(4);
    setFontFamily("Josefin Sans");
  };

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


  const MIN_SIZE = 30;
  const MAX_SIZE = 1500;
  const clamp = (val) => Math.min(Math.max(val, MIN_SIZE), MAX_SIZE);
  const clampLineWidth = (val) => Math.min(Math.max(val, MIN_LINE_WIDTH), MAX_LINE_WIDTH);

  const clampContainerWidth  = (val) => Math.min(Math.max(val, CONTAINER_MIN_WIDTH),  CONTAINER_MAX_WIDTH);
  const clampContainerHeight = (val) => Math.min(Math.max(val, CONTAINER_MIN_HEIGHT), CONTAINER_MAX_HEIGHT);

  const handleWidthChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const raw = parseInt(e.target.value, 10);
    setWidth(isNaN(raw) ? "" : raw);
    const obj = selectedObjectRef.current;
    if (!obj || isNaN(raw) || raw <= 0) return;

    const isContainerObj = obj._blockType === "container";
    const val = isContainerObj ? clampContainerWidth(raw) : clamp(raw);
    if (val !== raw) setWidth(val);

    if (obj.type === "group" || obj.type === "rect") {
      obj.set({ scaleX: val / obj.width });
    } else if (obj.type === "textbox") {
      obj.set({ width: val });
    }
    commitResize();
  };


  const handleHeightChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const raw = parseInt(e.target.value, 10);
    setHeight(isNaN(raw) ? "" : raw);
    const obj = selectedObjectRef.current;
    if (!obj || isNaN(raw) || raw <= 0) return;

    const isContainerObj = obj._blockType === "container";
    const val = isContainerObj ? clampContainerHeight(raw) : clamp(raw);
    if (val !== raw) setHeight(val);

    if (obj.type === "group" || obj.type === "rect") {
      obj.set({ scaleY: val / obj.height });
    }
    commitResize();
  };


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


  const handleStrokeColorChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;
    const value = e.target.value;
    setColorStroke(value);
    const obj = selectedObjectRef.current;
    if (!obj) return;

    if (obj.type === "group") {
     
      const bg = obj.getObjects().find((o) => o._isBackground);
      if (bg) {
        bg.set({ stroke: value });
      } else {
        obj.set({ stroke: value });
      }
      obj.dirty = true;
    } else {
      obj.set({ stroke: value });
   
      if (obj._blockType === "container" && obj._linkedLabel) {
        obj._linkedLabel.set({ fill: value });
      }
    }
    canvas.requestRenderAll();
  };


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
   
    obj._outline?.set({ strokeWidth: val + OUTLINE_EXTRA_WIDTH * 2 });
    canvas.requestRenderAll();
  };


  const handleFontChange = (newFont) => {
    const canvas = canvasReady;
    const obj    = selectedObjectRef.current;
    if (!canvas || !obj) return;

    setFontFamily(newFont);

    loadGoogleFont(newFont, () => {
      obj.set({ fontFamily: newFont });
  
      obj._fitToContent?.();
      obj.setCoords();
      canvas.fire("object:modified", { target: obj });
      canvas.requestRenderAll();
    });
  };


  const handleContainerNameChange = (e) => {
    const canvas = canvasReady;
    if (!canvas) return;

    const value = e.target.value.slice(0, CONTAINER_LABEL_MAX_LENGTH);
    setContainerName(value);
    const obj = selectedObjectRef.current;
    if (!obj || obj._blockType !== "container" || !obj._linkedLabel) return;

    obj._linkedLabel.set({ text: value });
    obj._linkedLabel.setCoords();
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
          {isTextObject && (
            <>
              <label className={styles.label}>Fonte</label>
              <FontSelector value={fontFamily} onChange={handleFontChange} />
            </>
          )}
          {isContainer && (
            <>
              <label
                className={styles.label}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                Nome
                <CharCounter current={containerName.length} max={CONTAINER_LABEL_MAX_LENGTH} />
              </label>
              <input
                type="text"
                placeholder="Nome da seção"
                value={containerName}
                onChange={handleContainerNameChange}
                maxLength={CONTAINER_LABEL_MAX_LENGTH}
                className={styles.input1}
              />
            </>
          )}
          {!isContainer && (
            <>
              <label className={styles.label}>Fill</label>
              <input
                type="color"
                value={color}
                onChange={handleColorChange}
                className={styles.inputColor}
              />
            </>
          )}
          <label className={styles.label}>{isContainer ? "Cor da borda" : "Stroke"}</label>
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