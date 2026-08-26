import * as fabric from "fabric";
import { PORT_RADIUS_BASE, PORT_FILL, PORT_STROKE, SELECTION_STYLE, repositionContainerLabel } from "./constants";
import { getAbsoluteCenter, getAbsoluteEdge } from "./geometry";


// +10% sobre o valor anterior (4.25 -> 4.675)
export const DEFAULT_CONNECTION_COLOR = "#ffffff";
export const DEFAULT_CONNECTION_WIDTH = 4.675;


const OUTLINE_COLOR      = "rgba(20, 24, 34, 0.35)";
export const OUTLINE_EXTRA_WIDTH = 0.15;

// Tolerância extra (em unidades de mundo do canvas, mesma unidade do
// strokeWidth) somada à metade da espessura da linha para decidir se um
// clique "acertou" a conexão. Ajuste aqui se quiser a área clicável mais
// generosa ou mais precisa.
const CONNECTION_CLICK_TOLERANCE = 6;


const PORT_SIDES = ["left", "right", "top", "bottom"];

// Distância do ponto (px, py) até o segmento de reta (x1,y1)-(x2,y2).
// Funciona igual para segmentos retos ou diagonais — é pura geometria,
// não depende de bounding box nem de renderização em canvas auxiliar.
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}


export function createPortsAndConnections(cs, activePortsRef) {
  const getPortRadius = (block) => {
    const w = block.getScaledWidth();
    const h = block.getScaledHeight();
    const size = Math.max(w, h);
    return PORT_RADIUS_BASE * Math.pow(1.05, size / 100);
  };

  const clearPorts = () => {
    activePortsRef.current.forEach((p) => cs.remove(p));
    activePortsRef.current = [];
    cs.requestRenderAll();
  };

  const createPort = (block, side) => {
    const center = block.getCenterPoint();
    const hw = block.getScaledWidth()  / 2;
    const hh = block.getScaledHeight() / 2;
    const radius = getPortRadius(block);
    const OFFSET = radius + 18;

    let x = center.x;
    let y = center.y;
    if (side === "left")   x = center.x - hw - OFFSET;
    if (side === "right")  x = center.x + hw + OFFSET;
    if (side === "top")    y = center.y - hh - OFFSET;
    if (side === "bottom") y = center.y + hh + OFFSET;

    const port = new fabric.Circle({
      radius,
      fill: PORT_FILL,
      stroke: PORT_STROKE,
      strokeWidth: 2,
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: true,
      hoverCursor: "crosshair",
      _isPort: true,
      _block: block,
      _side: side,
    });

    cs.add(port);
    cs.bringObjectToFront(port);
    return port;
  };


  const showPorts = (block) => {
    clearPorts();
    if (
      !block ||
      block._isPort ||
      block.isLine ||
      block._blockType === "text" ||
      block._blockType === "container"
    ) return;
    activePortsRef.current = PORT_SIDES.map((side) => createPort(block, side));
    cs.requestRenderAll();
  };

  const updateConnectionLines = (block) => {
    if (!block.connections?.length) return;
    block.connections.forEach(({ line, outline, sourceBlock, targetBlock, fromSide, toSide }) => {
      const src = getAbsoluteEdge(sourceBlock, fromSide);
      const dst = getAbsoluteEdge(targetBlock, toSide);
      line.set({ x1: src.x, y1: src.y, x2: dst.x, y2: dst.y });
      outline?.set({ x1: src.x, y1: src.y, x2: dst.x, y2: dst.y });
    });
  };

  const repositionPorts = (block) => {
    const center = getAbsoluteCenter(block);
    const hw = block.getScaledWidth()  / 2;
    const hh = block.getScaledHeight() / 2;
    const radius = getPortRadius(block);
    const OFFSET = radius + 18;

    activePortsRef.current.forEach((port) => {
      if (port._block !== block) return;
      let x = center.x;
      let y = center.y;
      if (port._side === "left")   x = center.x - hw - OFFSET;
      if (port._side === "right")  x = center.x + hw + OFFSET;
      if (port._side === "top")    y = center.y - hh - OFFSET;
      if (port._side === "bottom") y = center.y + hh + OFFSET;
      port.set({ left: x, top: y, radius });
      port.setCoords();
    });
  };

  const refreshBlock = (block) => {
    repositionPorts(block);
    updateConnectionLines(block);
   
    if (block._isBackground && block._linkedLabel) repositionContainerLabel(block);
    cs.requestRenderAll();
  };

  const refreshActiveSelection = (activeSelection) => {
    activeSelection.getObjects().forEach((obj) => {
      if (obj._isPort || obj.isLine) return;
      updateConnectionLines(obj);
      if (obj._isBackground && obj._linkedLabel) repositionContainerLabel(obj);
    });
    cs.requestRenderAll();
  };

  const createConnection = (source, dest, fromSide, toSide, style = {}) => {
    const alreadyConnected = source.connections?.some(
      ({ sourceBlock, targetBlock }) =>
        (sourceBlock === source && targetBlock === dest) ||
        (sourceBlock === dest && targetBlock === source)
    );
    if (alreadyConnected) return;

    const src = getAbsoluteEdge(source, fromSide);
    const dst = getAbsoluteEdge(dest, toSide);

    const strokeColor = style.color ?? DEFAULT_CONNECTION_COLOR;
    const strokeWidthVal = style.strokeWidth ?? DEFAULT_CONNECTION_WIDTH;

    const outline = new fabric.Line([src.x, src.y, dst.x, dst.y], {
      stroke: OUTLINE_COLOR,
      strokeWidth: strokeWidthVal + OUTLINE_EXTRA_WIDTH * 2,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      isLine: true,
      _isConnectionOutline: true,
      originX: "center",
      originY: "center",
    });

    const line = new fabric.Line([src.x, src.y, dst.x, dst.y], {
      borderColor: SELECTION_STYLE.borderColor,
      borderDashArray: SELECTION_STYLE.borderDashArray,
      stroke: strokeColor,
      strokeWidth: strokeWidthVal,

      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: true,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hoverCursor: "pointer",
      // O teste por pixel (perPixelTargetFind) fica pouco confiável em
      // linhas diagonais longas: o Fabric renderiza o objeto num canvas
      // auxiliar dimensionado pelo bounding box, e esse canvas é reduzido
      // internamente quando o bounding box é grande (o que só acontece
      // quando a linha é diagonal — reta sempre tem uma dimensão ~0).
      // Substituímos por um teste geométrico manual em containsPoint logo
      // abaixo, que funciona igual em qualquer ângulo.
      perPixelTargetFind: false,
      isLine: true,
      originX: "center",
      originY: "center",
    });

    // Hit-test próprio: distância real do ponto clicado até o segmento
    // (x1,y1)-(x2,y2), com tolerância = metade da espessura + margem extra.
    //
    // IMPORTANTE: x1/y1/x2/y2 estão em coordenadas de MUNDO (mesmo espaço
    // de canvasInstance.left/top), mas o `point` que o Fabric passa pra
    // containsPoint durante a busca de clique já vem no espaço de
    // VIEWPORT (com zoom/pan aplicados) — e esse canvas já começa com um
    // pan aplicado (centralização do grid 5000x5000 em Index.jsx). Por
    // isso é preciso converter `point` de volta pro espaço de mundo com o
    // inverso do viewportTransform atual antes de comparar; sem isso o
    // teste só "acerta" por coincidência, dependendo do zoom/pan do
    // momento — exatamente o comportamento inconsistente relatado.
    line.containsPoint = function (point) {
      const vpt = cs.viewportTransform;
      const worldPoint = vpt
        ? fabric.util.transformPoint(point, fabric.util.invertTransform(vpt))
        : point;

      const tolerance = (this.strokeWidth ?? DEFAULT_CONNECTION_WIDTH) / 2 + CONNECTION_CLICK_TOLERANCE;
      return distanceToSegment(worldPoint.x, worldPoint.y, this.x1, this.y1, this.x2, this.y2) <= tolerance;
    };

    cs.add(outline);
    cs.add(line);
  
    cs.sendObjectToBack(line);
    cs.sendObjectToBack(outline);

    line._outline = outline;

    if (!source.connections) source.connections = [];
    if (!dest.connections) dest.connections = [];
    const conn = { line, outline, sourceBlock: source, targetBlock: dest, fromSide, toSide };

    const updateLine = () => {
      const s = getAbsoluteEdge(source, fromSide);
      const d = getAbsoluteEdge(dest, toSide);
      line.set({ x1: s.x, y1: s.y, x2: d.x, y2: d.y });
      outline.set({ x1: s.x, y1: s.y, x2: d.x, y2: d.y });
      cs.requestRenderAll();
    };
   
    conn.updateLine = updateLine;

    source.connections.push(conn);
    dest.connections.push(conn);

    source.on("moving", updateLine);
    source.on("scaling", updateLine);
    source.on("modified", updateLine);
    dest.on("moving", updateLine);
    dest.on("scaling", updateLine);
    dest.on("modified", updateLine);

    cs.requestRenderAll();
    return conn;
  };


  const deleteConnection = (conn) => {
    if (!conn) return;
    const { line, outline, sourceBlock, targetBlock, updateLine } = conn;

    if (updateLine) {
      sourceBlock?.off("moving", updateLine);
      sourceBlock?.off("scaling", updateLine);
      sourceBlock?.off("modified", updateLine);
      targetBlock?.off("moving", updateLine);
      targetBlock?.off("scaling", updateLine);
      targetBlock?.off("modified", updateLine);
    }

    if (sourceBlock?.connections) {
      sourceBlock.connections = sourceBlock.connections.filter((c) => c !== conn);
    }
    if (targetBlock?.connections) {
      targetBlock.connections = targetBlock.connections.filter((c) => c !== conn);
    }

    cs.remove(line);
    if (outline) cs.remove(outline);
  };


  const findConnectionByLine = (line) => {
    let found = null;
    cs.getObjects().some((obj) => {
      if (!obj.connections?.length) return false;
      const conn = obj.connections.find((c) => c.line === line);
      if (conn) { found = conn; return true; }
      return false;
    });
    return found;
  };

  const captureConnMeta = (conn) => ({
    sourceBlock: conn.sourceBlock,
    targetBlock: conn.targetBlock,
    fromSide: conn.fromSide,
    toSide: conn.toSide,
    color: conn.line.stroke,
    strokeWidth: conn.line.strokeWidth,
  });

  const makeConnectionAddAction = (conn) => {
    let current = conn;
    const meta = captureConnMeta(conn);
    return {
      undo: () => deleteConnection(current),
      redo: () => {
        current = createConnection(
          meta.sourceBlock, meta.targetBlock, meta.fromSide, meta.toSide,
          { color: meta.color, strokeWidth: meta.strokeWidth }
        );
      },
    };
  };


  const makeConnectionRemoveAction = (conn) => {
    let current = conn;
    const meta = captureConnMeta(conn);
    return {
      undo: () => {
        current = createConnection(
          meta.sourceBlock, meta.targetBlock, meta.fromSide, meta.toSide,
          { color: meta.color, strokeWidth: meta.strokeWidth }
        );
      },
      redo: () => deleteConnection(current),
    };
  };

    return {
    getPortRadius,
    clearPorts,
    createPort,
    showPorts,
    updateConnectionLines,
    repositionPorts,
    refreshBlock,
    refreshActiveSelection,
    createConnection,
    deleteConnection,
    findConnectionByLine,
    makeConnectionAddAction,
    makeConnectionRemoveAction,
  };
}