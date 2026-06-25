import React, { useRef, useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import stylestoolbox from "./modules/toolbox.module.css";
import stylescanva from "./modules/canva.module.css";
import Navbar from "./Navbar";
import Settings from "./Settings";
import GridCanvas from "./GridCanvas";
import Axis from "./Axis";
import BackButton from './BackButton'

export default function Index() {
  const canvasRef         = useRef(null);
  const gridRef           = useRef(null);
  const canvasInstanceRef = useRef(null);
  const sourceBlockRef    = useRef(null);
  const tempLineRef       = useRef(null);
  const isDraggingPort    = useRef(false);
  const activePortsRef    = useRef([]);
  const checkAlignmentRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(null);

  const handleAxisReady = useCallback((fn) => {
    checkAlignmentRef.current = fn;
  }, []);

  const centerCanvas = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return;
    cs.setViewportTransform([1, 0, 0, 1,
      (window.innerWidth  - 5000) / 2,
      (window.innerHeight - 5000) / 2,
    ]);
    cs.requestRenderAll();
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const removeRotation = (cls) => {
      if (!cls) return;
      if (cls.prototype?.controls?.mtr) {
        cls.prototype.controls.mtr.visible = false;
        cls.prototype.controls.mtr.render  = () => {};
      }
      if (cls.ownDefaults?.controls?.mtr) {
        cls.ownDefaults.controls.mtr.visible = false;
        cls.ownDefaults.controls.mtr.render  = () => {};
      }
    };
    [
      fabric.FabricObject,
      fabric.Rect,
      fabric.Circle,
      fabric.Textbox,
      fabric.Text,
      fabric.Group,
      fabric.ActiveSelection,
      fabric.Line,
      fabric.Image,
    ].forEach(removeRotation);

    const cs = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const drawGrid = () => {
      gridRef.current?.redraw(cs.viewportTransform, cs.getZoom());
    };

    cs.on("after:render", drawGrid);

    cs.on("object:added", (opt) => {
      if (opt.target?._blockType !== "text") return;
      cs.bringObjectToFront(opt.target);
    });

    if (cs.lowerCanvasEl) cs.lowerCanvasEl.style.backgroundColor = "transparent";
    if (cs.upperCanvasEl) cs.upperCanvasEl.style.backgroundColor = "transparent";

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      cs.width  = w;
      cs.height = h;
      const upperCanvas = cs.upperCanvasEl;
      const lowerCanvas = cs.lowerCanvasEl;
      if (upperCanvas) { upperCanvas.width = w; upperCanvas.height = h; }
      if (lowerCanvas) { lowerCanvas.width = w; lowerCanvas.height = h; }
      gridRef.current?.resize();
      drawGrid();
      cs.requestRenderAll();
    };
    window.addEventListener("resize", handleResize);

    cs.setViewportTransform([1, 0, 0, 1,
      (window.innerWidth  - 5000) / 2,
      (window.innerHeight - 5000) / 2,
    ]);
    cs.requestRenderAll();

    canvasInstanceRef.current = cs;
    setCanvasReady(cs);

    const PORT_RADIUS_BASE = 7;
    const PORT_FILL        = "#93c5fd";
    const PORT_STROKE      = "#fff";

    const getPortRadius = (block) => {
      const w = block.getScaledWidth();
      const h = block.getScaledHeight();
      const size = Math.max(w, h);
      const steps = size / 100;
      return PORT_RADIUS_BASE * Math.pow(1.05, steps);
    };

    const clearPorts = () => {
      activePortsRef.current.forEach((p) => cs.remove(p));
      activePortsRef.current = [];
      cs.requestRenderAll();
    };

    const createPort = (block, side) => {
      const center = block.getCenterPoint();
      const hw     = block.getScaledWidth() / 2;
      const radius = getPortRadius(block);
      const OFFSET = radius + 18;
      const x = side === "left" ? center.x - hw - OFFSET : center.x + hw + OFFSET;

      const port = new fabric.Circle({
        radius:      radius,
        fill:        PORT_FILL,
        stroke:      PORT_STROKE,
        strokeWidth: 2,
        left:        x,
        top:         center.y,
        originX:     "center",
        originY:     "center",
        selectable:  false,
        evented:     true,
        hoverCursor: "crosshair",
        _isPort:     true,
        _block:      block,
        _side:       side,
      });

      cs.add(port);
      cs.bringObjectToFront(port);
      return port;
    };

    const showPorts = (block) => {
      clearPorts();
      // Textos não recebem portas de conexão
      if (!block || block._isPort || block.isLine || block._blockType === "text") return;
      activePortsRef.current = [createPort(block, "left"), createPort(block, "right")];
      cs.requestRenderAll();
    };

    const getAbsoluteCenter = (obj) => {
      obj.setCoords();
      const m = obj.calcTransformMatrix();
      return { x: m[4], y: m[5] };
    };

    const getAbsoluteEdge = (obj, side) => {
      const center = getAbsoluteCenter(obj);
      const hw     = obj.getScaledWidth() / 2;
      return {
        x: side === "left" ? center.x - hw : center.x + hw,
        y: center.y,
      };
    };

    const updateConnectionLines = (block) => {
      if (!block.connections?.length) return;
      block.connections.forEach(({ line, sourceBlock, targetBlock, fromSide, toSide }) => {
        const src = getAbsoluteEdge(sourceBlock, fromSide);
        const dst = getAbsoluteEdge(targetBlock, toSide);
        line.set({ x1: src.x, y1: src.y, x2: dst.x, y2: dst.y });
      });
    };

    const repositionPorts = (block) => {
      const center = getAbsoluteCenter(block);
      const hw     = block.getScaledWidth() / 2;
      const radius = getPortRadius(block);
      const OFFSET = radius + 18;
      activePortsRef.current.forEach((port) => {
        if (port._block !== block) return;
        const x = port._side === "left" ? center.x - hw - OFFSET : center.x + hw + OFFSET;
        port.set({ left: x, top: center.y, radius });
        port.setCoords();
      });
    };

    const refreshBlock = (block) => {
      repositionPorts(block);
      updateConnectionLines(block);
      cs.requestRenderAll();
    };

    const refreshActiveSelection = (activeSelection) => {
      activeSelection.getObjects().forEach((obj) => {
        if (obj._isPort || obj.isLine) return;
        updateConnectionLines(obj);
      });
      cs.requestRenderAll();
    };

    const createConnection = (source, dest, fromSide, toSide) => {
      const alreadyConnected = source.connections?.some(
        ({ sourceBlock, targetBlock }) =>
          (sourceBlock === source && targetBlock === dest) ||
          (sourceBlock === dest   && targetBlock === source)
      );
      if (alreadyConnected) return;

      const src = getAbsoluteEdge(source, fromSide);
      const dst = getAbsoluteEdge(dest,   toSide);

      const line = new fabric.Line([src.x, src.y, dst.x, dst.y], {
        stroke:      "#ffffff",
        strokeWidth: 5,
        selectable:  false,
        evented:     false,
        isLine:      true,
        originX:     "center",
        originY:     "center",
      });

      cs.add(line);
      cs.sendObjectToBack(line);

      if (!source.connections) source.connections = [];
      if (!dest.connections)   dest.connections   = [];
      const conn = { line, sourceBlock: source, targetBlock: dest, fromSide, toSide };
      source.connections.push(conn);
      dest.connections.push(conn);

      const updateLine = () => {
        const s = getAbsoluteEdge(source, fromSide);
        const d = getAbsoluteEdge(dest,   toSide);
        line.set({ x1: s.x, y1: s.y, x2: d.x, y2: d.y });
        cs.requestRenderAll();
      };

      source.on("moving",   updateLine);
      source.on("scaling",  updateLine);
      source.on("modified", updateLine);
      dest.on("moving",     updateLine);
      dest.on("scaling",    updateLine);
      dest.on("modified",   updateLine);

      cs.requestRenderAll();
    };

    const startTempLine = (x, y) => {
      const line = new fabric.Line([x, y, x, y], {
        stroke:          "#5083ef",
        strokeWidth:     2,
        strokeDashArray: [6, 4],
        selectable:      false,
        evented:         false,
        isLine:          true,
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

    const toCanvasPoint = (clientX, clientY) => {
      const vpt  = cs.viewportTransform;
      const zoom = cs.getZoom();
      return {
        x: (clientX - vpt[4]) / zoom,
        y: (clientY - vpt[5]) / zoom,
      };
    };

    const onMouseDown = (opt) => {
      const target = opt.target;

      if (target?._isPort) {
        isDraggingPort.current = true;
        sourceBlockRef.current = { block: target._block, side: target._side };
        const pos = toCanvasPoint(opt.e.clientX, opt.e.clientY);
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
      }
    };

    const onMouseMove = (opt) => {
      if (isDraggingPort.current) {
        const pos = toCanvasPoint(opt.e.clientX, opt.e.clientY);
        updateTempLine(pos.x, pos.y);
        return;
      }

      if (onMouseDown._panActive) {
        const PAN_LIMIT = { minX: -5000, maxX: 5000, minY: -5000, maxY: 5000 };
        const e    = opt.e;
        const vpt  = cs.viewportTransform.slice();
        const zoom = vpt[0];
        const nx   = vpt[4] + (e.clientX - onMouseDown._lastX);
        const ny   = vpt[5] + (e.clientY - onMouseDown._lastY);
        vpt[4] = Math.min(Math.max(nx, PAN_LIMIT.minX * zoom), PAN_LIMIT.maxX * zoom);
        vpt[5] = Math.min(Math.max(ny, PAN_LIMIT.minY * zoom), PAN_LIMIT.maxY * zoom);
        cs.setViewportTransform(vpt);
        onMouseDown._lastX = e.clientX;
        onMouseDown._lastY = e.clientY;
      }
    };

    const onMouseUp = (opt) => {
      onMouseDown._panActive = false;
      cs.selection = true;

      if (!isDraggingPort.current) return;
      isDraggingPort.current = false;
      removeTempLine();

      const sourceData = sourceBlockRef.current;
      sourceBlockRef.current = null;

      if (!sourceData) return;
      const { block: source, side: fromSide } = sourceData;

      const target = opt.target;
      if (!target || target.isLine || target._isPort || target === source) return;

      const destCenter = target.getCenterPoint();
      const pos        = toCanvasPoint(opt.e.clientX, opt.e.clientY);
      const toSide     = pos.x < destCenter.x ? "left" : "right";

      createConnection(source, target, fromSide ?? "right", toSide);
    };

    const onSelected = (opt) => {
      const activeObj = cs.getActiveObject();
      if (activeObj?.type === "activeselection") {
        activeObj.set({
          hasControls:      false,
          lockScalingX:     true,
          lockScalingY:     true,
          lockScalingFlip:  true,
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

      if (target._isLabel && target._linkedBg) {
        const center = target.getCenterPoint();
        target._linkedBg.set({ left: center.x, top: center.y });
        target._linkedBg.setCoords();
      }

      if (target.type === "activeselection") {
        refreshActiveSelection(target);
      } else {
        refreshBlock(target);
        // ── Snap e guias visuais do Axis ──────────────────────────────────────
        checkAlignmentRef.current?.(target);
      }
    };

    const MIN_SIZE = 50;
    const MAX_SIZE = 1500;

    const onScaling = (opt) => {
      const target = opt.target;
      if (!target) return;

      // Textos não têm tamanho mínimo — apenas blocos e grupos
      if (target.type !== "activeselection" && target._blockType !== "text") {
        const w = target.width  * target.scaleX;
        const h = target.height * target.scaleY;

        if (w < MIN_SIZE) target.scaleX = MIN_SIZE / target.width;
        if (h < MIN_SIZE) target.scaleY = MIN_SIZE / target.height;
        if (w > MAX_SIZE) target.scaleX = MAX_SIZE / target.width;
        if (h > MAX_SIZE) target.scaleY = MAX_SIZE / target.height;
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
      zoom = Math.min(Math.max(zoom, 0.5), 1.5);
      cs.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
    };

    const fitBgToLabel = (label) => {
      const bg = label._linkedBg;
      if (!bg) return;
      const PAD_X = 28;
      const PAD_Y = 16;
      const center = label.getCenterPoint();
      bg.set({
        width:  label.width  + PAD_X,
        height: label.calcTextHeight() + PAD_Y,
        left:   center.x,
        top:    center.y,
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
        target.off("changed",        onChanged);
        target.off("editing:exited", onExit);
        fitBgToLabel(target);
        cs.requestRenderAll();
      });
    };

    const onKeyDown = (e) => {
      if (e.key !== "Delete") return;
      const cs = canvasInstanceRef.current;
      if (!cs) return;

      const active = cs.getActiveObject();
      if (!active || active.isEditing) return;

      if (active.type === "activeselection") {
        const objects = [...active.getObjects()];
        cs.discardActiveObject();
        cs.requestRenderAll();
        objects.forEach((obj) => {
          if (obj.connections?.length) {
            obj.connections.forEach(({ line, sourceBlock, targetBlock }) => {
              cs.remove(line);
              const other = sourceBlock === obj ? targetBlock : sourceBlock;
              if (other?.connections) {
                other.connections = other.connections.filter((c) => c.line !== line);
              }
            });
          }
          cs.remove(obj);
        });
        clearPorts();
        cs.requestRenderAll();
        return;
      }

      if (active.connections?.length) {
        active.connections.forEach(({ line, sourceBlock, targetBlock }) => {
          cs.remove(line);
          const other = sourceBlock === active ? targetBlock : sourceBlock;
          if (other?.connections) {
            other.connections = other.connections.filter((c) => c.line !== line);
          }
        });
      }
      clearPorts();
      if (active._isLabel && active._linkedBg) cs.remove(active._linkedBg);
      cs.remove(active);
      cs.discardActiveObject();
      cs.requestRenderAll();
    };

    const disableCtrlZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };

    cs.on("mouse:down",        onMouseDown);
    cs.on("mouse:dblclick",    onDoubleClick);
    cs.on("mouse:move",        onMouseMove);
    cs.on("mouse:up",          onMouseUp);
    cs.on("mouse:wheel",       onWheel);
    cs.on("selection:created", onSelected);
    cs.on("selection:updated", onSelected);
    cs.on("selection:cleared", onDeselected);
    cs.on("object:moving",     onMoving);
    cs.on("object:scaling",    onScaling);
    cs.on("object:modified",   onModified);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel",   disableCtrlZoom, { passive: false });
    window.addEventListener("resize",  handleResize);

    return () => {
      cs.off("mouse:down",        onMouseDown);
      cs.off("mouse:dblclick",    onDoubleClick);
      cs.off("mouse:move",        onMouseMove);
      cs.off("mouse:up",          onMouseUp);
      cs.off("mouse:wheel",       onWheel);
      cs.off("selection:created", onSelected);
      cs.off("selection:updated", onSelected);
      cs.off("selection:cleared", onDeselected);
      cs.off("object:moving",     onMoving);
      cs.off("object:scaling",    onScaling);
      cs.off("object:modified",   onModified);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel",   disableCtrlZoom);
      window.removeEventListener("resize",  handleResize);
      canvasInstanceRef.current = null;
      cs.dispose();
    };
  }, []);

  const addBox = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return;
    const vpt     = cs.viewportTransform;
    const centerX = (window.innerWidth  / 2 - vpt[4]) / vpt[0];
    const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];
    const box = new fabric.Rect({
      width: 300, height: 300,
      fill: "#ffffff",
      stroke: "#cccccc",
      strokeWidth: 2,
      strokeUniform: true,
      left: centerX - 150, top: centerY - 150,
      lockRotation: true,
      hasRotatingPoint: false,
      _blockType: "rect",
    });
    cs.add(box);
    cs.setActiveObject(box);
    cs.requestRenderAll();
  };

  const addGroup = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return;
    const vpt     = cs.viewportTransform;
    const centerX = (window.innerWidth  / 2 - vpt[4]) / vpt[0];
    const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];

    const PAD_X = 28;
    const PAD_Y = 16;

    const label = new fabric.Textbox("hello", {
      left:            centerX,
      top:             centerY,
      originX:         "center",
      originY:         "center",
      width:           200,
      fontFamily:      "Josefin Sans",
      fontSize:        20,
      textAlign:       "center",
      fill:            "#000000",
      selectable:      true,
      evented:         true,
      lockRotation:    true,
      hasRotatingPoint: false,
      splitByGrapheme: false,
      _blockType:      "group",
      _isLabel:        true,
    });

    const bw = label.width  + PAD_X;
    const bh = label.height + PAD_Y;

    const bg = new fabric.Rect({
      left:          centerX,
      top:           centerY,
      originX:       "center",
      originY:       "center",
      width:         bw,
      height:        bh,
      fill:          "#ffffff",
      stroke:        "#cccccc",
      strokeWidth:   2,
      strokeUniform: true,
      selectable:    false,
      evented:       false,
      lockRotation:  true,
      _isBackground: true,
      _linkedLabel:  label,
    });

    label._linkedBg = bg;

    cs.add(bg);
    cs.add(label);
    cs.bringObjectToFront(label);
    cs.setActiveObject(label);
    cs.requestRenderAll();
  };

  const addText = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return;
    const vpt     = cs.viewportTransform;
    const centerX = (window.innerWidth  / 2 - vpt[4]) / vpt[0];
    const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];

    const text = new fabric.Textbox("Texto", {
      left:             centerX,
      top:              centerY,
      originX:          "center",
      originY:          "center",
      width:            200,
      fontFamily:       "Josefin Sans",
      fontSize:         24,
      textAlign:        "center",
      fill:             "#333333",
      splitByGrapheme:  false,
      _blockType:       "text",
    });

    const fitToContent = () => {
      const lines  = text.text.split("\n");
      const tmpCtx = document.createElement("canvas").getContext("2d");
      tmpCtx.font  = `${text.fontWeight ?? "normal"} ${text.fontSize}px ${text.fontFamily}`;
      const maxW   = Math.max(...lines.map((l) => tmpCtx.measureText(l).width));
      const padded = Math.ceil(maxW) + text.fontSize;
      text.set({ width: Math.max(padded, 40) });
      text.setCoords();
      cs.requestRenderAll();
    };

    text.on("changed",        fitToContent);
    text.on("editing:exited", fitToContent);

    cs.add(text);
    cs.bringObjectToFront(text);
    cs.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    cs.requestRenderAll();
  };

  return (
    <div className="App">
      <div className={stylestoolbox.toolbox}>
        <button onClick={addGroup} className={stylestoolbox.button}>addg</button>
        <button onClick={addBox}   className={stylestoolbox.button}>addb</button>
        <button onClick={addText}  className={stylestoolbox.button}>addt</button>
        <button onClick={centerCanvas} className={stylestoolbox.button}>⌖ center</button>
        <Settings canvasRef={canvasInstanceRef} canvasReady={canvasReady} />
      </div>

      <Axis canvasReady={canvasReady} onReady={handleAxisReady} />

      <div className={stylescanva.canvaWrapper}>
        <GridCanvas ref={gridRef} />
        <canvas
          id="canvas"
          className={stylescanva.canva}
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
        />
      </div>

      <Navbar />
    </div>
  );
}