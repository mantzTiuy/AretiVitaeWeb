import * as fabric from "fabric";
import { PORT_RADIUS_BASE, PORT_FILL, PORT_STROKE, SELECTION_STYLE } from "./constants";
import { getAbsoluteCenter, getAbsoluteEdge } from "./geometry";

// Fábrica que recebe a instância do canvas (cs) e um ref mutável que guarda
// as portas ativas no momento (activePortsRef.current é um array de fabric.Circle).
// Retorna todas as funções de porta + conexão, exatamente como no arquivo original.
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
    const hw = block.getScaledWidth() / 2;
    const radius = getPortRadius(block);
    const OFFSET = radius + 18;
    const x = side === "left" ? center.x - hw - OFFSET : center.x + hw + OFFSET;

    const port = new fabric.Circle({
      radius,
      fill: PORT_FILL,
      stroke: PORT_STROKE,
      strokeWidth: 2,
      left: x,
      top: center.y,
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
    if (!block || block._isPort || block.isLine || block._blockType === "text") return;
    activePortsRef.current = [createPort(block, "left"), createPort(block, "right")];
    cs.requestRenderAll();
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
    const hw = block.getScaledWidth() / 2;
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

  // ── createConnection ─────────────────────────────────────────────────────
  const createConnection = (source, dest, fromSide, toSide) => {
    const alreadyConnected = source.connections?.some(
      ({ sourceBlock, targetBlock }) =>
        (sourceBlock === source && targetBlock === dest) ||
        (sourceBlock === dest && targetBlock === source)
    );
    if (alreadyConnected) return;

    const src = getAbsoluteEdge(source, fromSide);
    const dst = getAbsoluteEdge(dest, toSide);

    const line = new fabric.Line([src.x, src.y, dst.x, dst.y], {
      borderColor: SELECTION_STYLE.borderColor,
      borderDashArray: SELECTION_STYLE.borderDashArray,
      stroke: "#ffffff",
      strokeWidth: 4.25, // 15% mais fina (era 5)
      // ── Agora a linha PODE ser selecionada e deletada, mas não arrastada ──
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
      perPixelTargetFind: true, // clique precisa acertar o traço, não só a bounding box
      isLine: true,
      originX: "center",
      originY: "center",
    });

    cs.add(line);
    cs.sendObjectToBack(line);

    if (!source.connections) source.connections = [];
    if (!dest.connections) dest.connections = [];
    const conn = { line, sourceBlock: source, targetBlock: dest, fromSide, toSide };

    const updateLine = () => {
      const s = getAbsoluteEdge(source, fromSide);
      const d = getAbsoluteEdge(dest, toSide);
      line.set({ x1: s.x, y1: s.y, x2: d.x, y2: d.y });
      cs.requestRenderAll();
    };
    // guarda a referência para conseguir remover os listeners depois (deleteConnection)
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

  // ── deleteConnection ─────────────────────────────────────────────────────
  const deleteConnection = (conn) => {
    if (!conn) return;
    const { line, sourceBlock, targetBlock, updateLine } = conn;

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
  };

  // Dado um objeto de linha, encontra a conexão correspondente vasculhando
  // os arrays `connections` dos blocos (a linha não guarda referência
  // direta para trás, então precisamos procurar).
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
  };
}