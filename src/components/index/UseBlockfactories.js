import * as fabric from "fabric";
import { SELECTION_STYLE } from "./constants";

// Cada função recebe a instância `cs` já resolvida (não um ref), para não
// correr o risco de ler `ref.current` durante o render. Quem chama essas
// funções (index.jsx) deve fazer `canvasInstanceRef.current` dentro do
// próprio handler de clique e passar o resultado aqui.

export function addBox(cs) {
  if (!cs) return;
  const vpt = cs.viewportTransform;
  const centerX = (window.innerWidth / 2 - vpt[4]) / vpt[0];
  const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];
  const box = new fabric.Rect({
    ...SELECTION_STYLE,
    width: 180,
    height: 180,
    fill: "#ffffff",
    stroke: "#cccccc",
    strokeWidth: 2,
    strokeUniform: true,
    left: centerX - 90,
    top: centerY - 90,
    lockRotation: true,
    hasRotatingPoint: false,
    _blockType: "rect",
  });
  cs.add(box);
  cs.setActiveObject(box);
  cs.requestRenderAll();
}

export function addGroup(cs) {
  if (!cs) return;
  const vpt = cs.viewportTransform;
  const centerX = (window.innerWidth / 2 - vpt[4]) / vpt[0];
  const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];

  const PAD_X = 20;
  const PAD_Y = 10;

  const label = new fabric.Textbox("hello", {
    ...SELECTION_STYLE,
    left: centerX,
    top: centerY,
    originX: "center",
    originY: "center",
    width: 140,
    fontFamily: "Josefin Sans",
    fontSize: 14,
    textAlign: "center",
    fill: "#000000",
    selectable: true,
    evented: true,
    lockRotation: true,
    hasRotatingPoint: false,
    splitByGrapheme: false,
    _blockType: "group",
    _isLabel: true,
  });

  const bw = label.width + PAD_X;
  const bh = label.height + PAD_Y;

  const bg = new fabric.Rect({
    left: centerX,
    top: centerY,
    originX: "center",
    originY: "center",
    width: bw,
    height: bh,
    fill: "#ffffff",
    stroke: "#cccccc",
    strokeWidth: 2,
    strokeUniform: true,
    selectable: false,
    evented: false,
    lockRotation: true,
    _isBackground: true,
    _linkedLabel: label,
  });

  label._linkedBg = bg;

  cs.add(bg);
  cs.add(label);
  cs.bringObjectToFront(label);
  cs.setActiveObject(label);
  cs.requestRenderAll();
}

export function addText(cs) {
  if (!cs) return;
  const vpt = cs.viewportTransform;
  const centerX = (window.innerWidth / 2 - vpt[4]) / vpt[0];
  const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];

  const text = new fabric.Textbox("Texto", {
    ...SELECTION_STYLE,
    left: centerX,
    top: centerY,
    originX: "center",
    originY: "center",
    width: 140,
    fontFamily: "Josefin Sans",
    fontSize: 16,
    textAlign: "center",
    fill: "#333333",
    splitByGrapheme: false,
    _blockType: "text",
  });

  const fitToContent = () => {
    const lines = text.text.split("\n");
    const tmpCtx = document.createElement("canvas").getContext("2d");
    tmpCtx.font = `${text.fontWeight ?? "normal"} ${text.fontSize}px ${text.fontFamily}`;
    const maxW = Math.max(...lines.map((l) => tmpCtx.measureText(l).width));
    const padded = Math.ceil(maxW) + text.fontSize;
    text.set({ width: Math.max(padded, 40) });
    text.setCoords();
    cs.requestRenderAll();
  };

  text.on("changed", fitToContent);
  text.on("editing:exited", fitToContent);

  cs.add(text);
  cs.bringObjectToFront(text);
  cs.setActiveObject(text);
  text.enterEditing();
  text.selectAll();
  cs.requestRenderAll();
}