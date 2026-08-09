import * as fabric from "fabric";
import { PORT_RADIUS_BASE, PORT_FILL, PORT_STROKE, SELECTION_STYLE, repositionContainerLabel } from "./constants";
import { getAbsoluteCenter, getAbsoluteEdge } from "./geometry";

// Valores padrão usados quando uma conexão é criada sem estilo customizado
// (ex: ao arrastar de uma porta pra outra pela primeira vez).
export const DEFAULT_CONNECTION_COLOR = "#ffffff";
export const DEFAULT_CONNECTION_WIDTH = 4.25;

// ── Contorno da linha (outline) ─────────────────────────────────────────
// A cor da linha é livre (o usuário escolhe no Settings, e o padrão é
// branco). Isso é ótimo dentro do editor (fundo azul claro), mas no SVG
// exportado (useSvgExport.js) o fundo costuma ser branco/transparente — daí
// uma linha branca simplesmente some. Pra linha ficar "naturalmente"
// visível em qualquer fundo, cada conexão ganha um segundo fabric.Line, um
// pouco mais largo e com uma cor escura semi-transparente, desenhado
// IMEDIATAMENTE atrás da linha colorida — funciona como um contorno/halo
// fino, sem alterar a cor que o usuário definiu.
const OUTLINE_COLOR      = "rgba(20, 24, 34, 0.35)";
export const OUTLINE_EXTRA_WIDTH = 0.15; // px de canvas adicionados de cada lado da linha real

// Os 4 lados possíveis de um bloco pra portas/conexões — esquerda/direita
// (como já existia) e agora também cima/baixo.
const PORT_SIDES = ["left", "right", "top", "bottom"];

// Fábrica que recebe a instância do canvas (cs) e um ref mutável que guarda
// as portas ativas no momento (activePortsRef.current é um array de fabric.Circle,
// agora com até 4 por bloco selecionado — uma por lado).
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

  // Containers não permitem conexões: nunca ganham portas, então nunca dá
  // pra iniciar um arrasto de conexão a partir deles.
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
    // Se for o retângulo de um container, mantém o nome grudado no canto.
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

  // ── createConnection ─────────────────────────────────────────────────────
  // `style` permite customizar a aparência da linha ao criá-la:
  // { color, strokeWidth }. Usado tanto na criação "a mão" (arrastar porta)
  // quanto na reconstrução das conexões salvas (usePersistence.js), pra
  // preservar cor/espessura editadas pelo usuário no Settings.
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

    // Contorno fino: mesma geometria da linha real, um pouco mais largo e
    // sempre numa cor escura semi-transparente — não interativo (o clique
    // e a seleção continuam só na linha colorida por cima).
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

    cs.add(outline);
    cs.add(line);
    // Ordem: linha colorida primeiro pro fundo, depois o contorno — assim o
    // contorno fica ATRÁS da linha real (a última chamada de sendToBack
    // "vence" e vai pro índice 0).
    cs.sendObjectToBack(line);
    cs.sendObjectToBack(outline);

    // Referência direta pra fora: Settings.jsx só tem acesso à linha
    // colorida (é o objeto ativo do canvas), não ao `conn` inteiro — essa
    // referência é o que permite reajustar a espessura do contorno junto
    // sempre que o usuário mudar a espessura da linha (handleLineWidthChange).
    // Sem isso, o contorno ficava "preso" na espessura de quando a conexão
    // foi criada e sobrava como uma sombra ao redor da linha depois de
    // diminuir a grossura.
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

  // Dado um objeto de linha, encontra a conexão correspondente vasculhando
  // os arrays `connections` dos blocos (a linha não guarda referência
  // direta para trás, então precisamos procurar). Só procura pela linha
  // "real" (conn.line) — o contorno (conn.outline) não é clicável, então
  // nunca chega aqui como `line`.
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