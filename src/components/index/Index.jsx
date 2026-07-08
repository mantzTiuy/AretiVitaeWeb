import React, { useRef, useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import axios from "axios";
import { useParams } from "react-router-dom";
import stylestoolbox from "./modules/toolbox.module.css";
import stylescanva from "./modules/canva.module.css";
import Navbar from "./Navbar";
import Settings from "./Settings";
import GridCanvas from "./GridCanvas";
import Axis from "./Axis";
import BackButton from './BackButton'

const generateId = () => Math.random().toString(36).slice(2, 10); //Gerador de ids para os blocos


//Essas determinadas seleções não fazem parte do carregamento feito em json
const SELECTION_STYLE = {
  cornerColor:        "#5083ef",   
  cornerStrokeColor:  "#ffffff",   
  cornerSize:         12,         
  cornerStyle:        "circle",   
  transparentCorners: false,      
  borderColor:        "#5083ef",  
  borderDashArray:    [4, 4],
  padding:            4,         
};

export default function Index() {
  const { id } = useParams();


  const canvasRef         = useRef(null);
  const gridRef           = useRef(null);
  const canvasInstanceRef = useRef(null);
  const sourceBlockRef    = useRef(null);
  const tempLineRef       = useRef(null);
  const isDraggingPort    = useRef(false);
  const activePortsRef    = useRef([]);
  const checkAlignmentRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(null);
  const [loadingMap, setLoadingMap]   = useState(true);
  const [erroMap, setErroMap]         = useState('');
  const [saveStatus, setSaveStatus]   = useState('idle');
  const saveTimeoutRef       = useRef(null);
  const isLoadingFromJsonRef = useRef(false);

//Permite que o os Axis não sejam reconstruidos no f5, por causa do useCallback
  const handleAxisReady = useCallback((fn) => {
    checkAlignmentRef.current = fn;
  }, []);


  const centerCanvas = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return;//Se o canvas não existir retorne
    cs.setViewportTransform([1, 0, 0, 1,
      (window.innerWidth  - 5000) / 2,
      (window.innerHeight - 5000) / 2,
    ]);
    cs.requestRenderAll();//Renderiza o canvas com as especicações acima
  };

  useEffect(() => {
    //Construtor que passa as infomações básicas acerca do canvas
    if (!canvasRef.current) return;
    const cs = new fabric.Canvas(canvasRef.current, {
      width:           window.innerWidth,
      height:          window.innerHeight,
      backgroundColor: "#eaf4fc",
    });

    const drawGrid = () => {
      gridRef.current?.redraw(cs.viewportTransform, cs.getZoom());
    };
//Desenha o grid
    cs.on("after:render", drawGrid);

    //Instaura um id para cada objeto, com objetivo de que quando salvo no json, ele retorne o mesmo id posteriormente para garantir a integridade das conexões
    cs.on("object:added", (opt) => {
      const obj = opt.target;
      if (!obj._isPort && !obj.isLine) {
        if (obj.blockId && !obj._id) {
          obj._id = obj.blockId;//Se tiver ID já instaurado ele prioriza o id do json
        } else if (!obj._id) {
          obj._id = generateId();//Caso não tenha nada ele gera um ID
        }
      }
      if (obj._blockType !== "text") return;
      cs.bringObjectToFront(obj);
    });


    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      //Redimencionamento básico
      cs.width  = w;
      cs.height = h;
      //Fabric usa de dois canvas sobrepostos, ou seja, para resize adequado é necessário que faça o resize de dois canvas ao mesmo tempo
      const upperCanvas = cs.upperCanvasEl;//Upper canvas para interações
      const lowerCanvas = cs.lowerCanvasEl;//Lower canvas que instaura o objeto
      if (upperCanvas) { upperCanvas.width = w; upperCanvas.height = h; }//Quando atingir o limite
      if (lowerCanvas) { lowerCanvas.width = w; lowerCanvas.height = h; }
      gridRef.current?.resize();//Garante que o canvas se redimencione no HTML
      drawGrid();
      cs.requestRenderAll();
    };
    window.addEventListener("resize", handleResize);

    cs.setViewportTransform([1, 0, 0, 1,
      (window.innerWidth  - 5000) / 2,
      (window.innerHeight - 5000) / 2,
    ]);//Define a "camera no centro do canvas"
    cs.requestRenderAll();

    canvasInstanceRef.current = cs;
    setCanvasReady(cs);

    // ── Portas de conexão ────────────────────────────────────────────────────
    const PORT_RADIUS_BASE = 7;
    const PORT_FILL        = "#93c5fd";
    const PORT_STROKE      = "#fff";

    const getPortRadius = (block) => {
      const w    = block.getScaledWidth();
      const h    = block.getScaledHeight();
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
      const hw     = block.getScaledWidth() / 2;
      const radius = getPortRadius(block);
      const OFFSET = radius + 18;
      const x = side === "left" ? center.x - hw - OFFSET : center.x + hw + OFFSET;

      const port = new fabric.Circle({
        radius,
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

    // ── createConnection ─────────────────────────────────────────────────────
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
        borderColor:       SELECTION_STYLE.borderColor,
        borderDashArray:   SELECTION_STYLE.borderDashArray,
        stroke:            "#ffffff",
        strokeWidth:       5,
        // ── Agora a linha PODE ser selecionada e deletada, mas não arrastada ──
        selectable:        true,
        evented:           true,
        hasControls:       false,
        hasBorders:        true,
        lockMovementX:     true,
        lockMovementY:     true,
        lockScalingX:      true,
        lockScalingY:      true,
        lockRotation:      true,
        hoverCursor:       "pointer",
        perPixelTargetFind:true, // clique precisa acertar o traço, não só a bounding box
        isLine:            true,
        originX:           "center",
        originY:           "center",
      });

      cs.add(line);
      cs.sendObjectToBack(line);

      if (!source.connections) source.connections = [];
      if (!dest.connections)   dest.connections   = [];
      const conn = { line, sourceBlock: source, targetBlock: dest, fromSide, toSide };

      const updateLine = () => {
        const s = getAbsoluteEdge(source, fromSide);
        const d = getAbsoluteEdge(dest,   toSide);
        line.set({ x1: s.x, y1: s.y, x2: d.x, y2: d.y });
        cs.requestRenderAll();
      };
      // guarda a referência para conseguir remover os listeners depois (deleteConnection)
      conn.updateLine = updateLine;

      source.connections.push(conn);
      dest.connections.push(conn);

      source.on("moving",   updateLine);
      source.on("scaling",  updateLine);
      source.on("modified", updateLine);
      dest.on("moving",     updateLine);
      dest.on("scaling",    updateLine);
      dest.on("modified",   updateLine);

      cs.requestRenderAll();
      return conn;
    };

    // ── deleteConnection ─────────────────────────────────────────────────────
    // Remove uma conexão por completo: tira a linha do canvas, desliga os
    // listeners de moving/scaling/modified dos dois blocos e limpa a entrada
    // dos arrays `connections` de ambos. Sem isso, deletar só a linha
    // "visualmente" deixaria a conexão fantasma nos blocos, que voltaria a
    // aparecer no próximo salvamento/reload.
    const deleteConnection = (conn) => {
      if (!conn) return;
      const { line, sourceBlock, targetBlock, updateLine } = conn;

      if (updateLine) {
        sourceBlock?.off("moving",   updateLine);
        sourceBlock?.off("scaling",  updateLine);
        sourceBlock?.off("modified", updateLine);
        targetBlock?.off("moving",   updateLine);
        targetBlock?.off("scaling",  updateLine);
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

    // ── SALVAR MAPA ──────────────────────────────────────────────────────────
    async function salvarMapa() {
      const cs = canvasInstanceRef.current;
      if (!cs) return;
      setSaveStatus('saving');
      try {
        // 1. Remove portas do canvas antes de serializar
        clearPorts();

        // 2. Garante _id em todo objeto "de verdade" (não porta, não linha)
        cs.getObjects().forEach((obj) => {
          if (obj._isPort || obj.isLine) return;
          if (!obj._id) obj._id = generateId();
        });

        // 3. Extrai conexões sem duplicar (usa os _id garantidos acima)
        const connections = [];
        const seen = new Set();
        cs.getObjects().forEach((obj) => {
          if (!obj.connections?.length) return;
          obj.connections.forEach((conn) => {
            if (seen.has(conn)) return;
            seen.add(conn);
            connections.push({
              sourceId: conn.sourceBlock._id,
              targetId: conn.targetBlock._id,
              fromSide: conn.fromSide,
              toSide:   conn.toSide,
            });
          });
        });

        // 4. Serializa o canvas da forma padrão do Fabric.
        //    IMPORTANTE: no Fabric 7.x, passar uma lista de propriedades
        //    customizadas para cs.toJSON(propertiesToInclude) NÃO está
        //    capturando props atribuídas diretamente na instância
        //    (obj.blockId = ...) — o campo vinha undefined no JSON gerado.
        //    Por isso, em vez de confiar nesse mecanismo, serializamos "cru"
        //    e injetamos os metadados manualmente logo abaixo, por POSIÇÃO,
        //    já que cs.toJSON().objects preserva exatamente a mesma ordem
        //    de cs.getObjects().
        const canvasJson = cs.toJSON();

        const liveObjects = cs.getObjects();
        const enrichedObjects = [];
        liveObjects.forEach((obj, i) => {
          if (obj._isPort || obj.isLine) return; // não persiste portas/linhas
          const json = canvasJson.objects[i];
          if (!json) return;

          json.blockId      = obj._id;
          json.blockType    = obj._blockType    ?? null;
          json.isLabel      = obj._isLabel      ?? false;
          json.isBackground = obj._isBackground ?? false;
          json.linkedId =
            obj._isLabel && obj._linkedBg
              ? (obj._linkedBg._id ?? null)
              : obj._isBackground && obj._linkedLabel
              ? (obj._linkedLabel._id ?? null)
              : null;

          enrichedObjects.push(json);
        });
        canvasJson.objects = enrichedObjects;

        console.log("SALVANDO connections:", connections);
        console.log("SALVANDO blockIds:", canvasJson.objects.map(o => o.blockId));

        // ── Validação de integridade ANTES de enviar ao backend ─────────────
        // Se isso disparar, o problema é no cliente (algo dessincroniza _id
        // antes do save). Se isso NUNCA disparar e mesmo assim o load vier
        // com ids diferentes, o problema está 100% no backend/round-trip.
        const savedBlockIds = new Set(canvasJson.objects.map(o => o.blockId));
        connections.forEach(({ sourceId, targetId }) => {
          if (!savedBlockIds.has(sourceId) || !savedBlockIds.has(targetId)) {
            console.error(
              "[INTEGRIDADE] Conexão referencia bloco que NÃO está sendo salvo!",
              { sourceId, targetId, savedBlockIds: [...savedBlockIds] }
            );
          }
        });

        const dataAtual = JSON.stringify({ canvasJson, connections });

        await axios.put(`http://localhost:8081/apiAvMap/update/${id}`, {
          data: dataAtual,
        });

        setSaveStatus('saved');
      } catch (error) {
        console.log('ERRO AO SALVAR MAPA:', error);
        setSaveStatus('error');
      }
    }

    canvasInstanceRef.current.salvarMapa = salvarMapa;

    // ── CARREGAR MAPA ────────────────────────────────────────────────────────
    let cancelled = false;

    async function carregarMapa() {
      try {
        const { data } = await axios.get(`http://localhost:8081/apiAvMap/${id}`);

        if (cancelled) return;

        if (data?.data) {
          let parsed;
          try {
            parsed = JSON.parse(data.data);
          } catch {
            parsed = null;
          }

          const canvasJson  = parsed?.canvasJson ?? data.data;
          const connections = parsed?.connections ?? [];

          isLoadingFromJsonRef.current = true;

          await cs.loadFromJSON(canvasJson);

          if (cancelled || !canvasInstanceRef.current) {
            isLoadingFromJsonRef.current = false;
            return;
          }

          isLoadingFromJsonRef.current = false;

          // ── Restaura _id de forma robusta ──────────────────────────────────
          // Em vez de confiar apenas na propriedade `blockId` que o Fabric
          // deveria ter restaurado no objeto vivo (o que pode falhar
          // silenciosamente dependendo do tipo de objeto/versão do Fabric),
          // usamos o próprio array `canvasJson.objects` que já temos em mãos
          // e correlacionamos por POSIÇÃO com `cs.getObjects()`. O Fabric
          // preserva a ordem de inserção em loadFromJSON, então objeto[i] do
          // JSON salvo corresponde sempre a objeto[i] carregado no canvas.
          const savedObjects  = canvasJson.objects ?? [];
          const loadedObjects = cs.getObjects();

          if (savedObjects.length !== loadedObjects.length) {
            console.warn(
              "Divergência entre objetos salvos e carregados:",
              savedObjects.length, "vs", loadedObjects.length
            );
          }

          loadedObjects.forEach((obj, i) => {
            const meta = savedObjects[i];
            const blockId = obj.blockId || meta?.blockId;

            if (blockId) {
              obj._id           = blockId;
              obj._blockType    = obj.blockType    ?? meta?.blockType    ?? obj._blockType;
              obj._isLabel      = obj.isLabel      ?? meta?.isLabel      ?? false;
              obj._isBackground = obj.isBackground ?? meta?.isBackground ?? false;
              obj._linkedIdRaw  = obj.linkedId     ?? meta?.linkedId     ?? null;
            } else if (!obj._id && !obj._isPort && !obj.isLine) {
              obj._id = generateId();
            }

            // ── Reaplica o estilo de seleção/handles (SELECTION_STYLE) ─────────
            // cs.toJSON() no Fabric 7.x NÃO inclui por padrão as props de estilo
            // de controle (cornerColor, cornerStrokeColor, cornerSize,
            // cornerStyle, transparentCorners, borderColor, borderDashArray,
            // padding). Elas só existem nos objetos criados nesta sessão via
            // addBox/addGroup/addText (que fazem o spread de SELECTION_STYLE na
            // criação). Após um loadFromJSON esses objetos voltam para o
            // default do Fabric, então precisamos reaplicar aqui manualmente,
            // objeto por objeto, exatamente como já fazemos com blockId/_id.
            if (!obj._isPort && !obj.isLine) {
              obj.set(SELECTION_STYLE);
            }
          });

          // Índice id → objeto
          const objById = {};
          cs.getObjects().forEach((obj) => {
            if (obj._id) objById[obj._id] = obj;
          });

          console.log("CARREGANDO objById keys:", Object.keys(objById));
          console.log("CARREGANDO connections:", connections);

          // Reconecta _linkedBg ↔ _isLabel usando linkedId (por ID, não por referência)
          cs.getObjects().forEach((obj) => {
            if (!obj._linkedIdRaw) return;
            const other = objById[obj._linkedIdRaw];
            if (!other) return;
            if (obj._isLabel) {
              obj._linkedBg     = other;
              other._linkedLabel = obj;
            } else if (obj._isBackground) {
              obj._linkedLabel = other;
              other._linkedBg  = obj;
            }
          });

          // Remove linhas fantasma restauradas pelo Fabric
          cs.getObjects()
            .filter((o) => o.isLine)
            .forEach((l) => cs.remove(l));

          // Força cálculo de coordenadas antes de criar as linhas
          cs.renderAll();
          cs.getObjects().forEach((obj) => obj.setCoords());

          connections.forEach(({ sourceId, targetId, fromSide, toSide }) => {
            const source = objById[sourceId];
            const dest   = objById[targetId];
            if (!source || !dest) {
              console.warn("Bloco não encontrado:", sourceId, targetId);
              return;
            }
            createConnection(source, dest, fromSide, toSide);
          });

          cs.requestRenderAll();
        }
      } catch (error) {
        if (cancelled) return;
        console.log('ERRO AO CARREGAR MAPA:', error);
        setErroMap('Não foi possível carregar esse mapa.');
      } finally {
        if (!cancelled) setLoadingMap(false);
      }
    }

    carregarMapa();

    // ── Linha temporária (drag de porta) ─────────────────────────────────────
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

    // ── Eventos do canvas ─────────────────────────────────────────────────────
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
      salvarMapa(); // ← salva automaticamente após criar conexão
    };

    const onSelected = (opt) => {
      const activeObj = cs.getActiveObject();
      if (activeObj?.type === "activeselection") {
        activeObj.set({
          hasControls:     false,
          lockScalingX:    true,
          lockScalingY:    true,
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

      if (target._isLabel && target._linkedBg) {
        const center = target.getCenterPoint();
        target._linkedBg.set({ left: center.x, top: center.y });
        target._linkedBg.setCoords();
      }

      if (target.type === "activeselection") {
        refreshActiveSelection(target);
      } else {
        refreshBlock(target);
        checkAlignmentRef.current?.(target);
      }
    };

    const MIN_SIZE = 50;
    const MAX_SIZE = 1500;

    const onScaling = (opt) => {
      const target = opt.target;
      if (!target) return;

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
      zoom = Math.min(Math.max(zoom, 0.5), 2.25); // zoom máximo aumentado de 1.5 para 2.25 (+50%)
      cs.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
    };

    const fitBgToLabel = (label) => {
      const bg = label._linkedBg;
      if (!bg) return;
      const PAD_X  = 28;
      const PAD_Y  = 16;
      const center = label.getCenterPoint();
      bg.set({
        width:  label.width + PAD_X,
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

    const onKeyDown = (e) => {
      if (e.key !== "Delete") return;
      const cs = canvasInstanceRef.current;
      if (!cs) return;

      const active = cs.getActiveObject();
      if (!active || active.isEditing) return;

      // ── Deletar apenas uma linha/conexão selecionada ──────────────────────
      if (active.isLine) {
        const conn = findConnectionByLine(active);
        if (conn) {
          deleteConnection(conn);
        } else {
          cs.remove(active); // linha órfã (sem conexão associada), remove direto
        }
        cs.discardActiveObject();
        cs.requestRenderAll();
        salvarMapa(); // ← salva após deletar a conexão
        return;
      }

      if (active.type === "activeselection") {
        const objects = [...active.getObjects()];
        cs.discardActiveObject();
        cs.requestRenderAll();
        objects.forEach((obj) => {
          if (obj.isLine) {
            const conn = findConnectionByLine(obj);
            if (conn) {
              deleteConnection(conn);
            } else {
              cs.remove(obj);
            }
            return;
          }
          if (obj.connections?.length) {
            [...obj.connections].forEach((conn) => deleteConnection(conn));
          }
          cs.remove(obj);
        });
        clearPorts();
        cs.requestRenderAll();
        salvarMapa(); // ← salva após deletar seleção múltipla
        return;
      }

      if (active.connections?.length) {
        [...active.connections].forEach((conn) => deleteConnection(conn));
      }
      clearPorts();
      if (active._isLabel && active._linkedBg) cs.remove(active._linkedBg);
      cs.remove(active);
      cs.discardActiveObject();
      cs.requestRenderAll();
      salvarMapa(); // ← salva após deletar objeto único
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
      cancelled = true;

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
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel",   disableCtrlZoom);
      window.removeEventListener("resize",  handleResize);
      canvasInstanceRef.current = null;
      cs.dispose();
    };
  }, [id]);

  const handleSalvarManual = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    canvasInstanceRef.current?.salvarMapa?.();
  };

  const addBox = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return;
    const vpt     = cs.viewportTransform;
    const centerX = (window.innerWidth  / 2 - vpt[4]) / vpt[0];
    const centerY = (window.innerHeight / 2 - vpt[5]) / vpt[3];
    const box = new fabric.Rect({
      ...SELECTION_STYLE,
      width:            300,
      height:           300,
      fill:             "#ffffff",
      stroke:           "#cccccc",
      strokeWidth:      2,
      strokeUniform:    true,
      left:             centerX - 150,
      top:              centerY - 150,
      lockRotation:     true,
      hasRotatingPoint: false,
      _blockType:       "rect",
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
      ...SELECTION_STYLE,
      left:             centerX,
      top:              centerY,
      originX:          "center",
      originY:          "center",
      width:            200,
      fontFamily:       "Josefin Sans",
      fontSize:         20,
      textAlign:        "center",
      fill:             "#000000",
      selectable:       true,
      evented:          true,
      lockRotation:     true,
      hasRotatingPoint: false,
      splitByGrapheme:  false,
      _blockType:       "group",
      _isLabel:         true,
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
      ...SELECTION_STYLE,
      left:            centerX,
      top:             centerY,
      originX:         "center",
      originY:         "center",
      width:           200,
      fontFamily:      "Josefin Sans",
      fontSize:        24,
      textAlign:       "center",
      fill:            "#333333",
      splitByGrapheme: false,
      _blockType:      "text",
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
      {erroMap && (
        <div style={{ position: 'absolute', top: 10, left: 10, color: 'red', zIndex: 10 }}>
          {erroMap}
        </div>
      )}

      <div className={stylestoolbox.toolbox}>
        <button onClick={addGroup}           className={stylestoolbox.button}>addg</button>
        <button onClick={addBox}             className={stylestoolbox.button}>addb</button>
        <button onClick={addText}            className={stylestoolbox.button}>addt</button>
        <button onClick={centerCanvas}       className={stylestoolbox.button}>center</button>
        <button onClick={handleSalvarManual} className={stylestoolbox.button}>
          {saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
        </button>
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