import * as fabric from "fabric";
import { toCanvasPoint } from "./geometry";
import {
  MIN_SIZE,
  MAX_SIZE,
  CONTAINER_MIN_WIDTH,
  CONTAINER_MIN_HEIGHT,
  CONTAINER_MAX_WIDTH,
  CONTAINER_MAX_HEIGHT,
} from "./constants";

export function createCanvasInteractions({
  cs,
  sourceBlockRef,
  tempLineRef,
  isDraggingPort,
  checkAlignmentRef,
  ports,
  salvarMapa,
  clipboard,
  brush,
}) {
  const {
    showPorts,
    clearPorts,
    refreshBlock,
    refreshActiveSelection,
    createConnection,
    deleteConnection,
    findConnectionByLine,
  } = ports;

  const startTempLine = (x, y) => {
    const line = new fabric.Line([x, y, x, y], {
      stroke: "#5083ef",
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      selectable: false,
      evented: false,
      isLine: true,
    });
    cs.add(line);
    cs.bringObjectToFront(line);
    tempLineRef.current = line;
  };

  const updateTempLine = (x2, y2) => {
    if (!tempLineRef.current) return;
    tempLineRef.current.set({ x2, y2 });
    cs.requestRenderAll();
  };

  const removeTempLine = () => {
    if (tempLineRef.current) {
      cs.remove(tempLineRef.current);
      tempLineRef.current = null;
    }
  };

  const onMouseDown = (opt) => {
    const target = opt.target;

    if (target?._isPort) {
      isDraggingPort.current = true;
      sourceBlockRef.current = { block: target._block, side: target._side };
      const pos = toCanvasPoint(cs, opt.e.clientX, opt.e.clientY);
      startTempLine(pos.x, pos.y);
      cs.selection = false;
      return;
    }

    const e = opt.e;
    if (e.ctrlKey || e.button === 1) {
      isDraggingPort.current = false;
      cs.selection = false;
      cs.discardActiveObject();
      cs.requestRenderAll();
      onMouseDown._panActive = true;
      onMouseDown._lastX = e.clientX;
      onMouseDown._lastY = e.clientY;
      return;
    }

    // A rubber-band selection is about to start (mousedown on empty
    // canvas). Fabric scans every object with selectable !== false and
    // whose bounds intersect the drag rectangle, and connection lines sit
    // spatially between the blocks they connect — so a rubber-band very
    // often clips one. Once a line becomes a member of an ActiveSelection,
    // even removing it afterwards leaves it in a broken state (it keeps
    // its correct coordinates but stops being rendered and stops
    // receiving clicks/Delete, i.e. becomes a "ghost"). The safe fix is
    // to make lines temporarily unselectable so they're excluded from the
    // scan itself, then restore them right after on mouse:up.
    if (!target && cs.selection) {
      const lines = cs.getObjects().filter((o) => o.isLine);
      lines.forEach((l) => {
        l._prevSelectable = l.selectable;
        l.selectable = false;
      });
      onMouseDown._suppressedLines = lines;
    }
  };

  const onMouseMove = (opt) => {
    if (isDraggingPort.current) {
      const pos = toCanvasPoint(cs, opt.e.clientX, opt.e.clientY);
      updateTempLine(pos.x, pos.y);
      return;
    }

    if (onMouseDown._panActive) {
      const PAN_LIMIT = { minX: -5000, maxX: 5000, minY: -5000, maxY: 5000 };
      const e = opt.e;
      const vpt = cs.viewportTransform.slice();
      const zoom = vpt[0];
      const nx = vpt[4] + (e.clientX - onMouseDown._lastX);
      const ny = vpt[5] + (e.clientY - onMouseDown._lastY);
      vpt[4] = Math.min(Math.max(nx, PAN_LIMIT.minX * zoom), PAN_LIMIT.maxX * zoom);
      vpt[5] = Math.min(Math.max(ny, PAN_LIMIT.minY * zoom), PAN_LIMIT.maxY * zoom);
      cs.setViewportTransform(vpt);
      onMouseDown._lastX = e.clientX;
      onMouseDown._lastY = e.clientY;
    }
  };

  const onMouseUp = (opt) => {
    const e = opt.e;

    if (!onMouseDown._panActive || e.buttons === 0) {
      onMouseDown._panActive = false;
      cs.selection = true;
    }

    // Fabric has already finalized the ActiveSelection by the time our
    // mouse:up listener runs, so it's now safe to give lines back their
    // normal click/delete interactivity.
    if (onMouseDown._suppressedLines) {
      onMouseDown._suppressedLines.forEach((l) => {
        l.selectable = l._prevSelectable !== undefined ? l._prevSelectable : true;
        delete l._prevSelectable;
      });
      onMouseDown._suppressedLines = null;
    }

    if (!isDraggingPort.current) return;
    isDraggingPort.current = false;
    removeTempLine();

    const sourceData = sourceBlockRef.current;
    sourceBlockRef.current = null;

    if (!sourceData) return;
    const { block: source, side: fromSide } = sourceData;

    const target = opt.target;
    if (!target || target.isLine || target._isPort || target === source) return;
    if (target._blockType === "container") return;

    const destCenter = target.getCenterPoint();
    const pos = toCanvasPoint(cs, opt.e.clientX, opt.e.clientY);

    const hw = target.getScaledWidth()  / 2 || 1;
    const hh = target.getScaledHeight() / 2 || 1;
    const dx = (pos.x - destCenter.x) / hw;
    const dy = (pos.y - destCenter.y) / hh;

    const toSide =
      Math.abs(dx) > Math.abs(dy)
        ? (dx < 0 ? "left" : "right")
        : (dy < 0 ? "top" : "bottom");

    createConnection(source, target, fromSide ?? "right", toSide);
    salvarMapa();
  };

  const onSelected = (opt) => {
    const activeObj = cs.getActiveObject();
    if (activeObj?.type === "activeselection") {
      activeObj.set({
        hasControls: false,
        lockScalingX: true,
        lockScalingY: true,
        lockScalingFlip: true,
      });
      cs.requestRenderAll();
      clearPorts();
      return;
    }
    const obj = opt.selected?.[0] ?? opt.target;
    if (!obj || obj._isPort || obj.isLine) { clearPorts(); return; }
    showPorts(obj);
  };

  const onDeselected = () => {
    if (!isDraggingPort.current) clearPorts();
  };

  const onMoving = (opt) => {
    const target = opt.target;
    if (!target) return;

    const isMultiSelection = target.type === "activeselection";

    if (!isMultiSelection) {
      checkAlignmentRef.current?.(target);
    }

    if (target._isLabel && target._linkedBg) {
      const center = target.getCenterPoint();
      target._linkedBg.set({ left: center.x, top: center.y });
      target._linkedBg.setCoords();
    }

    if (isMultiSelection) {
      refreshActiveSelection(target);
    } else {
      refreshBlock(target);
    }
  };

  const onScaling = (opt) => {
    const target = opt.target;
    if (!target) return;

    if (target.type !== "activeselection" && target._blockType !== "text") {
      const isContainer = target._blockType === "container";
      const minW = isContainer ? CONTAINER_MIN_WIDTH  : MIN_SIZE;
      const minH = isContainer ? CONTAINER_MIN_HEIGHT : MIN_SIZE;
      const maxW = isContainer ? CONTAINER_MAX_WIDTH  : MAX_SIZE;
      const maxH = isContainer ? CONTAINER_MAX_HEIGHT : MAX_SIZE;
      const w = target.width * target.scaleX;
      const h = target.height * target.scaleY;
      if (w < minW) target.scaleX = minW / target.width;
      if (h < minH) target.scaleY = minH / target.height;
      if (w > maxW) target.scaleX = maxW / target.width;
      if (h > maxH) target.scaleY = maxH / target.height;
    }

    if (target.type === "activeselection") {
      refreshActiveSelection(target);
    } else {
      refreshBlock(target);
    }
  };

  const onModified = (opt) => {
    const target = opt.target;
    if (!target) return;
    if (target.type === "activeselection") {
      refreshActiveSelection(target);
    } else {
      refreshBlock(target);
    }
  };

  const onWheel = (opt) => {
    opt.e.preventDefault();
    let zoom = cs.getZoom() * (0.999 ** opt.e.deltaY);
    zoom = Math.min(Math.max(zoom, 0.5), 4.05);
    cs.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
  };

  const fitBgToLabel = (label) => {
    const bg = label._linkedBg;
    if (!bg) return;
    const PAD_X = 28;
    const PAD_Y = 16;
    const center = label.getCenterPoint();
    bg.set({
      width: label.width + PAD_X,
      height: label.calcTextHeight() + PAD_Y,
      left: center.x,
      top: center.y,
    });
    bg.setCoords();
  };

  const onDoubleClick = (opt) => {
    const target = opt.target;
    if (!target || !target._isLabel) return;
    target.enterEditing();
    target.selectAll();
    cs.requestRenderAll();

    const onChanged = () => fitBgToLabel(target);
    target.on("changed", onChanged);

    target.on("editing:exited", function onExit() {
      target.off("changed", onChanged);
      target.off("editing:exited", onExit);
      fitBgToLabel(target);
      cs.requestRenderAll();
    });
  };

  const onKeyDown = (e, canvasInstanceRef) => {
    const currentCs = canvasInstanceRef.current;
    if (!currentCs) return;

    const isCopy  = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c";
    const isPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";

    if (isCopy || isPaste) {
      const active = currentCs.getActiveObject();

      const typingElsewhere =
        ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) ||
        document.activeElement?.isContentEditable;

      if (active?.isEditing || typingElsewhere) return;

      e.preventDefault();
      if (isCopy) {
        clipboard?.copySelection();
      } else {
        clipboard?.pasteClipboard();
      }
      return;
    }

    const key = e.key.toLowerCase();
    const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && key === "z";
    const isRedo =
      ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "z") ||
      ((e.ctrlKey || e.metaKey) && key === "y");

    if (isUndo || isRedo) {
      const active = currentCs.getActiveObject();
      const typingElsewhere =
        ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) ||
        document.activeElement?.isContentEditable;

      if (active?.isEditing || typingElsewhere) return;

      e.preventDefault();
      if (isUndo) {
        brush?.undo();
      } else {
        brush?.redo();
      }
      return;
    }

    if (e.key !== "Delete") return;

    const active = currentCs.getActiveObject();
    if (!active || active.isEditing) return;

    if (active.isLine) {
      const conn = findConnectionByLine(active);
      if (conn) {
        deleteConnection(conn);
      } else {
        currentCs.remove(active);
      }
      currentCs.discardActiveObject();
      currentCs.requestRenderAll();
      salvarMapa();
      return;
    }

    if (active.type === "activeselection") {
      const objects = [...active.getObjects()];
      currentCs.discardActiveObject();
      currentCs.requestRenderAll();
      objects.forEach((obj) => {
        if (obj.isLine) {
          const conn = findConnectionByLine(obj);
          if (conn) {
            deleteConnection(conn);
          } else {
            currentCs.remove(obj);
          }
          return;
        }
        if (obj.connections?.length) {
          [...obj.connections].forEach((conn) => deleteConnection(conn));
        }

        if (obj._isLabel && obj._linkedBg) currentCs.remove(obj._linkedBg);
        if (obj._isBackground && obj._linkedLabel) currentCs.remove(obj._linkedLabel);
        currentCs.remove(obj);
      });
      clearPorts();
      currentCs.requestRenderAll();
      salvarMapa();
      return;
    }

    if (active.connections?.length) {
      [...active.connections].forEach((conn) => deleteConnection(conn));
    }
    clearPorts();
    if (active._isLabel && active._linkedBg) currentCs.remove(active._linkedBg);

    if (active._isBackground && active._linkedLabel) currentCs.remove(active._linkedLabel);
    currentCs.remove(active);
    currentCs.discardActiveObject();
    currentCs.requestRenderAll();
    salvarMapa();
  };

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    onSelected,
    onDeselected,
    onMoving,
    onScaling,
    onModified,
    onDoubleClick,
    onKeyDown,
  };
}