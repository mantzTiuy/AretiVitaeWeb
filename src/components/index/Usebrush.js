import * as fabric from "fabric";
import { toCanvasPoint } from "./geometry";
import {
  tagDrawing,
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_ERASER_SIZE,
} from "./constants";
import { makeAddAction, makeRemoveAction, combineActions } from "./useHistory";

function circleIntersectsRect(cx, cy, r, rect) {
  const closestX = Math.max(rect.left, Math.min(cx, rect.left + rect.width));
  const closestY = Math.max(rect.top,  Math.min(cy, rect.top  + rect.height));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

export function createBrush(cs, { salvarMapa, history } = {}) {
  if (!cs) return null;

  let mode = null;
  let eraserSize = DEFAULT_ERASER_SIZE;
  let isErasing = false;
  let eraseBatch = null;

  const ensureBrush = () => {
    if (!(cs.freeDrawingBrush instanceof fabric.PencilBrush)) {
      cs.freeDrawingBrush = new fabric.PencilBrush(cs);
    }
    return cs.freeDrawingBrush;
  };

  const setColor = (color) => { ensureBrush().color = color; };
  const setSize  = (size)  => { ensureBrush().width = size; };
  const setEraserSize = (size) => { eraserSize = size; };

  const onPathCreated = (opt) => {
    const path = opt.path;
    if (!path) return;
    tagDrawing(path);
    cs.sendObjectToBack(path);
    history?.push(makeAddAction(cs, path, { toBack: true }));
    cs.requestRenderAll();
    salvarMapa?.();
  };
  cs.on("path:created", onPathCreated);

  const eraseAt = (pt) => {
    const r = eraserSize / 2;
    const hit = cs.getObjects().filter((obj) => {
      if (!obj._isDrawing) return false;
      if (eraseBatch.includes(obj)) return false;
      const rect = obj.getBoundingRect(true, true);
      return circleIntersectsRect(pt.x, pt.y, r, rect);
    });
    if (!hit.length) return;
    hit.forEach((obj) => {
      cs.remove(obj);
      eraseBatch.push(obj);
    });
    cs.requestRenderAll();
  };

  const onEraseMouseDown = (opt) => {
    if (opt.e.button === 1 || opt.e.ctrlKey) return;
    if (opt.target) return;

    isErasing = true;
    eraseBatch = [];
    eraseAt(toCanvasPoint(cs, opt.e.clientX, opt.e.clientY));
  };

  const onEraseMouseMove = (opt) => {
    if (!isErasing) return;
    if (cs.getActiveObject()) return;
    eraseAt(toCanvasPoint(cs, opt.e.clientX, opt.e.clientY));
  };

  const onEraseMouseUp = () => {
    isErasing = false;
    if (eraseBatch?.length) {
      history?.push(
        combineActions(
          eraseBatch.map((obj) => makeRemoveAction(cs, obj, { toBack: true }))
        )
      );
      salvarMapa?.();
    }
    eraseBatch = null;
  };

  const disable = () => {
    if (mode === "draw") {
      cs.isDrawingMode = false;
    }
    if (mode === "erase") {
      cs.off("mouse:down", onEraseMouseDown);
      cs.off("mouse:move", onEraseMouseMove);
      cs.off("mouse:up",   onEraseMouseUp);
      cs.selection    = true;
      cs.defaultCursor = "default";
      cs.hoverCursor   = "move";
      isErasing  = false;
      eraseBatch = null;
    }
    mode = null;
  };

  const enable = ({ color = DEFAULT_BRUSH_COLOR, size = DEFAULT_BRUSH_SIZE } = {}) => {
    disable();
    cs.discardActiveObject();
    cs.requestRenderAll();

    const brush = ensureBrush();
    brush.color = color;
    brush.width = size;
    cs.freeDrawingCursor = "crosshair";
    cs.isDrawingMode = true;
    mode = "draw";
  };

  const enableErase = ({ size = eraserSize } = {}) => {
    disable();
    cs.discardActiveObject();
    cs.requestRenderAll();

    eraserSize = size;
    cs.selection     = false;
    cs.defaultCursor = "cell";
    cs.hoverCursor   = "cell";
    cs.on("mouse:down", onEraseMouseDown);
    cs.on("mouse:move", onEraseMouseMove);
    cs.on("mouse:up",   onEraseMouseUp);
    mode = "erase";
  };

  const getMode = () => mode;

  const destroy = () => {
    disable();
    cs.off("path:created", onPathCreated);
  };

  return {
    enable,
    enableErase,
    disable,
    getMode,
    setColor,
    setSize,
    setEraserSize,
    destroy,
  };
}