import * as fabric from "fabric";
import {
  SELECTION_STYLE,
  noRotate,
  CONTAINER_LABEL_PAD,
  containerBorderOnly,
} from "./constants";
import { makeAddAction, combineActions } from "./useHistory";

export function addBox(cs, { history } = {}) {
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
  noRotate(box);
  cs.add(box);
  history?.push(makeAddAction(cs, box));
  cs.setActiveObject(box);
  cs.requestRenderAll();
}

export function attachTextAutosize(text, cs) {
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
  text._fitToContent = fitToContent;
  return fitToContent;
}

export function addText(cs, { history } = {}) {
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
  noRotate(text);

  attachTextAutosize(text, cs);

  cs.add(text);
  history?.push(makeAddAction(cs, text));
  cs.bringObjectToFront(text);
  cs.setActiveObject(text);
  text.enterEditing();
  text.selectAll();
  cs.requestRenderAll();
}

const CONTAINER_DEFAULT_WIDTH  = 500;
const CONTAINER_DEFAULT_HEIGHT = 350;
const CONTAINER_DEFAULT_COLOR  = "#5083ef";
const CONTAINER_DEFAULT_NAME   = "Seção";

export function addContainer(cs, { history } = {}) {
  if (!cs) return;
  const vpt = cs.viewportTransform;
  const centerX = (window.innerWidth / 2 - vpt[4]) / vpt[0];
  const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];

  const rect = new fabric.Rect({
    ...SELECTION_STYLE,
    left:   centerX - CONTAINER_DEFAULT_WIDTH / 2,
    top:    centerY - CONTAINER_DEFAULT_HEIGHT / 2,
    width:  CONTAINER_DEFAULT_WIDTH,
    height: CONTAINER_DEFAULT_HEIGHT,
    originX: "left",
    originY: "top",
    fill: "transparent",
    stroke: CONTAINER_DEFAULT_COLOR,
    strokeWidth: 3,
    strokeUniform: true,
    lockRotation: true,
    hasRotatingPoint: false,
    _blockType: "container",
    _isBackground: true,
  });
  noRotate(rect);

  containerBorderOnly(rect);

  const label = new fabric.Text(CONTAINER_DEFAULT_NAME, {
    left: rect.left + CONTAINER_LABEL_PAD,
    top:  rect.top  + CONTAINER_LABEL_PAD,
    originX: "left",
    originY: "top",
    fontFamily: "Josefin Sans",
    fontSize: 16,
    fontWeight: "600",
    fill: CONTAINER_DEFAULT_COLOR,
    selectable: false,
    evented: false,
    _blockType: "containerLabel",
    _isLabel: true,
    _isContainerLabel: true,
  });

  rect._linkedLabel = label;
  label._linkedBg   = rect;

  cs.add(rect);
  cs.add(label);
  history?.push(
    combineActions([
      makeAddAction(cs, rect, { toBack: true }),
      makeAddAction(cs, label),
    ])
  );
  cs.sendObjectToBack(rect);
  cs.setActiveObject(rect);
  cs.requestRenderAll();

  return rect;
}