import { getAbsoluteCenter } from "./geometry";

export const generateId = () => Math.random().toString(36).slice(2, 10);

export const SELECTION_STYLE = {
  cornerColor: "#5083ef",
  cornerStrokeColor: "#ffffff",
  cornerSize: 8,
  cornerStyle: "square",
  transparentCorners: false,
  borderColor: "#5083ef",
  borderDashArray: [4, 4],
  padding: 4,
  lockRotation: true,
  hasRotatingPoint: false,
  rotatingPointOffset: 0,
};

export const PORT_RADIUS_BASE = 5;
export const PORT_FILL = "#93c5fd";
export const PORT_STROKE = "#fff";

export const MIN_SIZE = 30;
export const MAX_SIZE = 1500;

export const CONTAINER_LABEL_MAX_LENGTH = 20;

export const CONTAINER_MIN_WIDTH  = 260;
export const CONTAINER_MIN_HEIGHT = 140;
export const CONTAINER_MAX_WIDTH  = 4000;
export const CONTAINER_MAX_HEIGHT = 4000;

export const CONTAINER_LABEL_PAD = 10;


export const CONTAINER_BORDER_HIT_MARGIN = 8;

export const API_BASE = "http://localhost:8081/apiAvMap";

export const DEFAULT_GRID_BG_COLOR   = "#cce6fe";
export const DEFAULT_GRID_LINE_COLOR = "#89bce8";

export const DEFAULT_BRUSH_COLOR = "#222222";
export const DEFAULT_BRUSH_SIZE  = 6;
export const MIN_BRUSH_SIZE      = 1;
export const MAX_BRUSH_SIZE      = 100;

export const DEFAULT_ERASER_SIZE = 40;
export const MIN_ERASER_SIZE     = 1;
export const MAX_ERASER_SIZE     = 100;

export function tagDrawing(path) {
  if (!path) return path;
  path._isDrawing   = true;
  path._blockType   = "drawing";
  path.selectable   = false;
  path.evented      = false;
  path.hasControls  = false;
  path.hasBorders   = false;
  path.lockRotation = true;
  return path;
}

export function noRotate(obj) {
  if (!obj) return obj;
  obj.set({ lockRotation: true });
  obj.setControlsVisibility?.({ mtr: false });
  if (obj.controls) {
    obj.controls = { ...obj.controls };
    delete obj.controls.mtr;
  }
  return obj;
}

export function containerBorderOnly(rect) {
  if (!rect) return rect;
  rect.perPixelTargetFind = false;
  rect.containsPoint = function (point) {
    const zoom   = this.canvas ? this.canvas.getZoom() : 1;
    const margin = CONTAINER_BORDER_HIT_MARGIN / zoom;

    const center = getAbsoluteCenter(this);
    const hw = this.getScaledWidth()  / 2;
    const hh = this.getScaledHeight() / 2;

    const dx = Math.abs(point.x - center.x);
    const dy = Math.abs(point.y - center.y);

   
    if (dx > hw + margin || dy > hh + margin) return false;

    return dx >= hw - margin && dy >= hh - margin;
  };
  return rect;
}

export function repositionContainerLabel(rect) {
  if (!rect || !rect._linkedLabel) return;
  const label = rect._linkedLabel;
  const center = getAbsoluteCenter(rect);
  const hw = rect.getScaledWidth() / 2;
  const hh = rect.getScaledHeight() / 2;
  label.set({
    left: center.x - hw + CONTAINER_LABEL_PAD,
    top:  center.y - hh + CONTAINER_LABEL_PAD,
  });
  label.setCoords();
}