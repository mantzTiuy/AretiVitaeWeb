import React, { useRef, useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import { useParams } from "react-router-dom";
import stylestoolbox from "./modules/toolbox.module.css";
import stylescanva from "./modules/canva.module.css";
import Navbar from "./Navbar";
import Settings from "./Settings";
import GridCanvas from "./GridCanvas";
import Axis from "./Axis";
import BackButton from './BackButton';
import CanvasSettingsPanel from "./CanvasSettingPanel";
import { createMediaImporter } from "./useMediaImporter";
import { createBrush } from "./useBrush";
import ToolButton from "./ToolButton";
import { MODEL_PATHS } from "./models";
import { TOOLBOX_BTN_SIZE, TOOLBOX_RADIUS, TOOLBOX_GAP, TOOLBOX_PADDING_X } from "./toolboxConfig";
import { useUserPlano } from "./useUserPlano";
import { useFontSelection } from "./useFontSelection";
import { createHistory } from "./useHistory";
import { toCanvasPoint } from "./geometry";

import {
  generateId,
  SELECTION_STYLE,
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
  DEFAULT_ERASER_SIZE,
  MIN_ERASER_SIZE,
  MAX_ERASER_SIZE,
  DEFAULT_GRID_BG_COLOR,
  DEFAULT_GRID_LINE_COLOR,
} from "./constants";
import { createPortsAndConnections } from "./usePortsAndConnections";
import { createPersistence } from "./usePersistence";
import {
  addBox as addBoxToCanvas,
  addText as addTextToCanvas,
  addContainer as addContainerToCanvas,
} from "./useBlockFactories";
import { createCanvasInteractions } from "./useCanvasInteractions";
import { createClipboard } from "./useClipboard";
import { exportCanvasAsSVG } from "./useSvgExport";
import ObjectContextMenu from "./ObjectContextMenu";


const MIN_PLANO_BRUSH           = 1;
const MIN_PLANO_MEDIA           = 2;
const MIN_PLANO_EXPORT_SVG      = 3; 
const MIN_PLANO_CANVAS_SETTINGS = 1; 

export default function Index() {
  const { id } = useParams();


  const historyRef = useRef(null);
  const canvasRef         = useRef(null);
  const gridRef           = useRef(null);
  const canvasInstanceRef = useRef(null);
  const sourceBlockRef    = useRef(null);
  const mediaImporterRef  = useRef(null);
  const brushRef          = useRef(null);
  const fileInputRef      = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const tempLineRef       = useRef(null);
  const isDraggingPort    = useRef(false);
  const activePortsRef    = useRef([]);
  const checkAlignmentRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(null);
  const [_loadingMap, setLoadingMap]  = useState(true);
  const [erroMap, setErroMap]         = useState('');
  const [saveStatus, setSaveStatus]   = useState('IDLE');
  const saveTimeoutRef       = useRef(null);
  const isLoadingFromJsonRef = useRef(false);
  // Última posição conhecida do mouse na tela (clientX/clientY), usada
  // pelos atalhos de teclado pra criar o objeto onde o mouse está, em vez
  // de sempre no centro do viewport (comportamento dos botões da toolbox).
  const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const [drawMode, setDrawMode]     = useState(null);
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize]   = useState(DEFAULT_BRUSH_SIZE);
  const [eraserSize, setEraserSizeState] = useState(DEFAULT_ERASER_SIZE);

  const [gridBgColor, setGridBgColor]     = useState(DEFAULT_GRID_BG_COLOR);
  const [gridLineColor, setGridLineColor] = useState(DEFAULT_GRID_LINE_COLOR);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const gridColorsRef = useRef({ bgColor: DEFAULT_GRID_BG_COLOR, lineColor: DEFAULT_GRID_LINE_COLOR });

  // Menu de contexto (botão direito) com as opções de camada, no estilo Canva.
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
  const contextMenuRef = useRef(null);
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => (prev.visible ? { visible: false, x: 0, y: 0, target: null } : prev));
  }, []);


  const { plano } = useUserPlano();


  const { fontsByCategory } = useFontSelection(plano);

  const canUseBrush        = plano >= MIN_PLANO_BRUSH;
  const canImportMedia     = plano >= MIN_PLANO_MEDIA;
  const canExportSvg       = plano >= MIN_PLANO_EXPORT_SVG;
  const canCustomizeCanvas = plano >= MIN_PLANO_CANVAS_SETTINGS;


  const requirePlano = (allowed) => allowed;

  useEffect(() => {
    gridColorsRef.current = { bgColor: gridBgColor, lineColor: gridLineColor };
  }, [gridBgColor, gridLineColor]);

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

    // FIX: precisa ser um objeto NOVO a cada execução do efeito (não um
    // useRef de componente). Em React 18 Strict Mode (dev) o efeito roda
    // "monta -> limpa -> monta de novo" de forma síncrona; se essa flag
    // fosse compartilhada entre as duas execuções, a segunda resetaria
    // `.current` para false antes da requisição da PRIMEIRA terminar,
    // fazendo o carregarMapa antigo (com um `cs` já destruído pelo
    // cleanup) continuar tentando rodar e quebrar com erros de canvas
    // (ex: "Cannot read properties of undefined (reading 'clearRect')").
    // O mesmo aconteceria em produção se o usuário trocasse de mapa (id)
    // rápido o suficiente para sobrepor dois carregamentos.
    const cancelledRef = { current: false };

    setGridBgColor(DEFAULT_GRID_BG_COLOR);
    setGridLineColor(DEFAULT_GRID_LINE_COLOR);

    const cs = new fabric.Canvas(canvasRef.current, {
      width:  window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "transparent",
      stopContextMenu: true, // sem isso o menu nativo do navegador abriria junto com o nosso
    });

    const drawGrid = () => {
      gridRef.current?.redraw(cs.viewportTransform, cs.getZoom());
    };
    cs.on("after:render", drawGrid);

    cs.on("object:added", (opt) => {
      const obj = opt.target;
      if (!obj._isPort && !obj.isLine) {
        if (obj.blockId && !obj._id) {
          obj._id = obj.blockId;
        } else if (!obj._id) {
          obj._id = generateId();
        }
      }
      if (obj._blockType !== "text") return;
      cs.bringObjectToFront(obj);
    });

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      cs.setDimensions({ width: w, height: h });
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

    const ports = createPortsAndConnections(cs, activePortsRef);

    const persistence = createPersistence({
      id,
      canvasInstanceRef,
      isLoadingFromJsonRef,
      setSaveStatus,
      setErroMap,
      setLoadingMap,
      clearPorts: ports.clearPorts,
      createConnection: ports.createConnection,
      SELECTION_STYLE,
      gridColorsRef,
      setGridColors: ({ bgColor, lineColor }) => {
        setGridBgColor(bgColor);
        setGridLineColor(lineColor);
      },
    });
    const { salvarMapa, carregarMapa } = persistence;

    canvasInstanceRef.current.salvarMapa = salvarMapa;

    historyRef.current = createHistory({ cs, salvarMapa });
    const history = historyRef.current;

    const clipboard = createClipboard({ cs, salvarMapa, history });

mediaImporterRef.current = createMediaImporter({ cs, salvarMapa, history }); // ver nota abaixo

brushRef.current = createBrush(cs, { salvarMapa, history });

const interactions = createCanvasInteractions({
  cs,
  sourceBlockRef,
  tempLineRef,
  isDraggingPort,
  checkAlignmentRef,
  ports,
  salvarMapa,
  clipboard,
  history, // note que `brush` saiu daqui, não é mais usado nesse hook
});

// FIX: essa chamada estava faltando — sem ela o canvas nunca busca o
// mapa salvo no backend e sempre abre em branco, mesmo quando o
// registro no banco tem conteúdo.
carregarMapa(cs, cancelledRef);

    const onMediaMouseUp = (opt) => {
      const clickedBtn = opt.subTargets?.some((o) => o._isDownloadBtn);
      if (clickedBtn && opt.target?._blockType === "media") {
        mediaImporterRef.current?.downloadMediaImage(opt.target);
      }
    };

    const onMediaDoubleClick = (opt) => {
      if (opt.target?._blockType === "media") {
        mediaImporterRef.current?.downloadMediaImage(opt.target);
      }
    };

    // Botão direito num objeto: replica o "clique direito -> opções de
    // camada" do Canva. O evento "contextmenu" do fabric já resolve pra
    // gente qual objeto está sob o cursor (opt.target).
    const onObjectContextMenu = (opt) => {
      const { target, e: nativeEvent } = opt;
      const isReorderable =
        target && !target._isPort && !target.isLine &&
        String(target.type).toLowerCase() !== "activeselection";

      if (!isReorderable) {
        closeContextMenu();
        return;
      }

      if (cs.getActiveObject() !== target) {
        cs.discardActiveObject();
        cs.setActiveObject(target);
        cs.requestRenderAll();
      }

      setContextMenu({
        visible: true,
        x: nativeEvent.clientX,
        y: nativeEvent.clientY,
        target,
      });
    };

    const onKeyDown = (e) => interactions.onKeyDown(e, canvasInstanceRef);
    const disableCtrlZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };

  
    const wrapperEl = canvasRef.current.parentElement;
    let suspendedDrawMode = false;
    const isPanTrigger = (e) => e.button === 1 || e.ctrlKey;

    const onWrapperMouseDown = (e) => {
      if (!isPanTrigger(e)) return;
      if (cs.isDrawingMode) {
     
        if (cs._isCurrentlyDrawing) {
          cs._onMouseUpInDrawingMode(e);
        }
        suspendedDrawMode = true;
        cs.isDrawingMode = false;
      }
    };

 
    const onWindowMouseUpRestoreDraw = (e) => {
      if (suspendedDrawMode && e.buttons === 0) {
        suspendedDrawMode = false;
        if (brushRef.current?.getMode() === "draw") {
          cs.isDrawingMode = true;
        }
      }
    };

    cs.on("mouse:down",        interactions.onMouseDown);
    cs.on("mouse:up",          interactions.onMouseUp);
    cs.on("mouse:up",          onMediaMouseUp);
    cs.on("mouse:dblclick",    interactions.onDoubleClick);
    cs.on("mouse:dblclick",    onMediaDoubleClick);
    cs.on("mouse:move",        interactions.onMouseMove);
    cs.on("mouse:wheel",       interactions.onWheel);
    cs.on("selection:created", interactions.onSelected);
    cs.on("selection:updated", interactions.onSelected);
    cs.on("selection:cleared", interactions.onDeselected);
    cs.on("object:moving",     interactions.onMoving);
    cs.on("object:scaling",    interactions.onScaling);
    cs.on("object:modified",   interactions.onModified);
    cs.on("contextmenu",       onObjectContextMenu);
    wrapperEl?.addEventListener("mousedown", onWrapperMouseDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel",   disableCtrlZoom, { passive: false });
    window.addEventListener("mouseup", onWindowMouseUpRestoreDraw);

    return () => {
      cancelledRef.current = true;

      cs.off("mouse:down",        interactions.onMouseDown);
      cs.off("mouse:up",          interactions.onMouseUp);
      cs.off("mouse:up",          onMediaMouseUp);
      cs.off("mouse:dblclick",    interactions.onDoubleClick);
      cs.off("mouse:dblclick",    onMediaDoubleClick);
      cs.off("mouse:move",        interactions.onMouseMove);
      cs.off("mouse:wheel",       interactions.onWheel);
      cs.off("selection:created", interactions.onSelected);
      cs.off("selection:updated", interactions.onSelected);
      cs.off("selection:cleared", interactions.onDeselected);
      cs.off("object:moving",     interactions.onMoving);
      cs.off("object:scaling",    interactions.onScaling);
      cs.off("object:modified",   interactions.onModified);
      cs.off("contextmenu",       onObjectContextMenu);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      wrapperEl?.removeEventListener("mousedown", onWrapperMouseDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel",   disableCtrlZoom);
      window.removeEventListener("mouseup", onWindowMouseUpRestoreDraw);
      window.removeEventListener("resize",  handleResize);
      brushRef.current?.destroy();
      brushRef.current = null;
      canvasInstanceRef.current = null;
      cs.dispose();
      closeContextMenu();
    };
  }, [id]);

  // Arrastar texto selecionado dentro de um bloco em edição (Textbox do
  // fabric) dispara os mesmos eventos nativos de drag do HTML usados para
  // soltar arquivos vindos do sistema operacional. Só um drag de arquivo
  // real traz o tipo "Files" em dataTransfer.types — uma seleção de texto
  // arrastada não traz. Usamos isso para não mostrar o overlay de
  // "Solte aqui o PDF ou imagem" enquanto o usuário só está selecionando
  // texto com o mouse.
  const isFileDrag = (e) => {
    const types = e.dataTransfer?.types;
    return !!types && Array.from(types).includes("Files");
  };

  const handleDragOver = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragOver(false);
    if (!requirePlano(canImportMedia)) return;
    if (e.dataTransfer?.files?.length) {
      mediaImporterRef.current?.handleFiles(e.dataTransfer.files);
    }
  };

  const handleSalvarManual = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    canvasInstanceRef.current?.salvarMapa?.();
  };

  const handleExportSVG = () => {
    if (!requirePlano(canExportSvg)) return;
    exportCanvasAsSVG(canvasInstanceRef.current, "mapa.svg");
  };

  // Ações do menu de camadas (botão direito): pulam pro topo ou pra base
  // da pilha de objetos.
  const handleLayerAction = (action) => {
    const cs = canvasInstanceRef.current;
    const target = contextMenu.target;
    closeContextMenu();
    if (!cs || !target) return;

    switch (action) {
      case "front":
        cs.bringObjectToFront(target);
        break;
      case "back":
        cs.sendObjectToBack(target);
        break;
      default:
        return;
    }

    cs.requestRenderAll();
    // Reaproveita o mesmo pipeline de "object:modified" (histórico +
    // salvamento automático) já usado ao mover/redimensionar blocos —
    // mudar a ordem de camadas não dispara esse evento sozinho.
    cs.fire("object:modified", { target });
  };

  const scheduleGridColorSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      canvasInstanceRef.current?.salvarMapa?.();
    }, 500);
  };

  const handleGridBgColorChange = (value) => {
    setGridBgColor(value);
    scheduleGridColorSave();
  };

  const handleGridLineColorChange = (value) => {
    setGridLineColor(value);
    scheduleGridColorSave();
  };

  const handleResetGridColors = () => {
    setGridBgColor(DEFAULT_GRID_BG_COLOR);
    setGridLineColor(DEFAULT_GRID_LINE_COLOR);
    scheduleGridColorSave();
  };

  const toggleCanvasSettings = () => {
    if (!showCanvasSettings) {
      if (!requirePlano(canCustomizeCanvas)) return;
    }
    setShowCanvasSettings((v) => !v);
  };

  const stopDrawing = () => {
    setDrawMode(null);
    brushRef.current?.disable();
  };

  const toggleDraw = () => {
    if (drawMode === "draw") {
      stopDrawing();
      return;
    }
    if (!requirePlano(canUseBrush)) return;
    setDrawMode("draw");
    brushRef.current?.enable({ color: brushColor, size: brushSize });
  };

  const toggleErase = () => {
    if (drawMode === "erase") {
      stopDrawing();
      return;
    }
    if (!requirePlano(canUseBrush)) return;
    setDrawMode("erase");
    brushRef.current?.enableErase({ size: eraserSize });
  };

  const handleBrushColorChange = (e) => {
    const value = e.target.value;
    setBrushColor(value);
    brushRef.current?.setColor(value);
  };

  const clampBrushSize  = (val) => Math.min(Math.max(val, MIN_BRUSH_SIZE),  MAX_BRUSH_SIZE);
  const clampEraserSize = (val) => Math.min(Math.max(val, MIN_ERASER_SIZE), MAX_ERASER_SIZE);

  const handleBrushSizeChange = (e) => {
    const raw = parseInt(e.target.value, 10);
    if (isNaN(raw)) { setBrushSize(""); return; }
    const value = clampBrushSize(raw);
    setBrushSize(value);
    brushRef.current?.setSize(value);
  };

  const handleEraserSizeChange = (e) => {
    const raw = parseInt(e.target.value, 10);
    if (isNaN(raw)) { setEraserSizeState(""); return; }
    const value = clampEraserSize(raw);
    setEraserSizeState(value);
    brushRef.current?.setEraserSize(value);
  };

  const handleUndo = () => historyRef.current?.undo();
const handleRedo = () => historyRef.current?.redo();

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape" && drawMode) stopDrawing();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [drawMode]);

  useEffect(() => {
    const onMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Fecha o menu de camadas ao clicar fora, apertar Esc, redimensionar a
  // janela ou dar scroll/zoom no canvas (senão ele fica flutuando numa
  // posição que não corresponde mais a nada).
  useEffect(() => {
    if (!contextMenu.visible) return;

    const handlePointerDown = (e) => {
      if (contextMenuRef.current?.contains(e.target)) return;
      closeContextMenu();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeContextMenu();
    };

    window.addEventListener("mousedown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("wheel", closeContextMenu, { passive: true });

    return () => {
      window.removeEventListener("mousedown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("wheel", closeContextMenu);
    };
  }, [contextMenu.visible, closeContextMenu]);

  // Converte a última posição conhecida do mouse (tela) pra coordenada de
  // mundo do canvas, no mesmo espaço que left/top dos objetos do fabric.
  const getMouseCanvasPoint = () => {
    const cs = canvasInstanceRef.current;
    if (!cs) return null;
    const { x, y } = mousePosRef.current;
    return toCanvasPoint(cs, x, y);
  };

  const addBox       = () => { stopDrawing(); addBoxToCanvas(canvasInstanceRef.current, { history: historyRef.current }); };
const addText      = () => { stopDrawing(); addTextToCanvas(canvasInstanceRef.current, { history: historyRef.current }); };
const addContainer = () => { stopDrawing(); addContainerToCanvas(canvasInstanceRef.current, { history: historyRef.current }); };

// Variantes usadas pelos atalhos de teclado (Shift+B/T/S): criam o objeto
// na posição do mouse, em vez do centro do viewport que os botões usam.
const addBoxAtMouse       = () => { stopDrawing(); addBoxToCanvas(canvasInstanceRef.current, { history: historyRef.current, position: getMouseCanvasPoint() }); };
const addTextAtMouse      = () => { stopDrawing(); addTextToCanvas(canvasInstanceRef.current, { history: historyRef.current, position: getMouseCanvasPoint() }); };
const addContainerAtMouse = () => { stopDrawing(); addContainerToCanvas(canvasInstanceRef.current, { history: historyRef.current, position: getMouseCanvasPoint() }); };
  const openFilePicker = () => {
    if (!requirePlano(canImportMedia)) return;
    stopDrawing();
    fileInputRef.current?.click();
  };

  // Atalhos de teclado da toolbox (Shift+letra). Sem array de dependências
  // de propósito: assim o efeito é re-registrado a cada render e os
  // closures (drawMode, plano, etc.) nunca ficam desatualizados, sem
  // precisar listar cada função/estado usado aqui dentro.
  useEffect(() => {
    const isTypingTarget = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return true;
      const active = canvasInstanceRef.current?.getActiveObject?.();
      return !!active?.isEditing;
    };

    const onShortcutKeyDown = (e) => {
      if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
      if (isTypingTarget(e)) return;

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          addBoxAtMouse();
          break;
        case "t":
          e.preventDefault();
          addTextAtMouse();
          break;
        case "s":
          e.preventDefault();
          addContainerAtMouse();
          break;
        case "m":
          e.preventDefault();
          openFilePicker();
          break;
        case "p":
          e.preventDefault();
          toggleDraw();
          break;
        case "e":
          e.preventDefault();
          toggleErase();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onShortcutKeyDown);
    return () => window.removeEventListener("keydown", onShortcutKeyDown);
  });

  const handleFileInputChange = (e) => {
    if (e.target.files?.length) {
      mediaImporterRef.current?.handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const saveStatusLabel =
    saveStatus === "saving" ? "Salvando..." :
    saveStatus === "error"  ? "Erro ao salvar" :
    "Salvar";

return (
    <div className="App">
      {erroMap && (
        <div className={stylescanva.errorMessage}>
          {erroMap}
        </div>
      )}

      <div
        className={stylestoolbox.toolbox}
        style={{
          "--toolbox-btn-size": `${TOOLBOX_BTN_SIZE}px`,
          "--toolbox-radius": `${TOOLBOX_RADIUS}px`,
          "--toolbox-gap": `${TOOLBOX_GAP}px`,
          "--toolbox-padding-x": `${TOOLBOX_PADDING_X}px`,
        }}
      >
        <div className={stylestoolbox.group}>
          <ToolButton path={MODEL_PATHS.addBox}       modelKey="addBox"       label="Adicionar bloco (Shift+B)" onClick={addBox} />
          <ToolButton path={MODEL_PATHS.addText}      modelKey="addText"      label="Adicionar texto (Shift+T)" onClick={addText} />
          <ToolButton path={MODEL_PATHS.addContainer} modelKey="addContainer" label="Adicionar seção (Shift+S)" onClick={addContainer} />
        </div>

        <div className={stylestoolbox.divider} />

        <div className={stylestoolbox.group}>
          <ToolButton path={MODEL_PATHS.center} modelKey="center" label="Centralizar"    onClick={centerCanvas} />
          <ToolButton
            path={MODEL_PATHS.media}
            modelKey="media"
            label="Importar mídia (Shift+M)"
            locked={!canImportMedia}
            onClick={openFilePicker}
          />
        </div>

        <div className={stylestoolbox.divider} />

        <div className={stylestoolbox.group}>
          <ToolButton
            path={MODEL_PATHS.brush}
            modelKey="brush"
            label="Pincel (Shift+P • Esc para sair)"
            active={drawMode === "draw"}
            locked={!canUseBrush}
            onClick={toggleDraw}
          />
          <ToolButton
            path={MODEL_PATHS.eraser}
            modelKey="eraser"
            label="Borracha (Shift+E • Esc para sair)"
            active={drawMode === "erase"}
            locked={!canUseBrush}
            onClick={toggleErase}
          />
        </div>

        <div className={stylestoolbox.divider} />

        <div className={stylestoolbox.group}>
          <ToolButton path={MODEL_PATHS.undo} modelKey="undo" label="Desfazer (Ctrl+Z)"      onClick={handleUndo} />
          <ToolButton path={MODEL_PATHS.redo} modelKey="redo" label="Refazer (Ctrl+Shift+Z)" onClick={handleRedo} />
        </div>
      </div>

    
      <div className={stylestoolbox.bottomToolbar}>
        <ToolButton
          path={MODEL_PATHS.save}
          modelKey="save"
          label="Salvar"
          statusLabel={saveStatusLabel}
          onClick={handleSalvarManual}
          tooltipPosition="top"
        />
        <ToolButton
          path={MODEL_PATHS.exportSvg}
          modelKey="exportSvg"
          label="Exportar SVG"
          locked={!canExportSvg}
          onClick={handleExportSVG}
          tooltipPosition="top"
        />
        <ToolButton
          path={MODEL_PATHS.settings}
          modelKey="settings"
          label="Configurações do canvas"
          active={showCanvasSettings}
          locked={!canCustomizeCanvas}
          onClick={toggleCanvasSettings}
          tooltipPosition="top"
        />
      </div>

   
      <CanvasSettingsPanel
        open={showCanvasSettings}
        onClose={() => setShowCanvasSettings(false)}
        bgColor={gridBgColor}
        lineColor={gridLineColor}
        onBgColorChange={handleGridBgColorChange}
        onLineColorChange={handleGridLineColorChange}
        onReset={handleResetGridColors}
      />

      
      <Settings
        canvasRef={canvasInstanceRef}
        canvasReady={canvasReady}
        brushColor={brushColor}
        brushSize={brushSize}
        onBrushColorChange={handleBrushColorChange}
        onBrushSizeChange={handleBrushSizeChange}
        minBrushSize={MIN_BRUSH_SIZE}
        maxBrushSize={MAX_BRUSH_SIZE}
        eraserSize={eraserSize}
        onEraserSizeChange={handleEraserSizeChange}
        minEraserSize={MIN_ERASER_SIZE}
        maxEraserSize={MAX_ERASER_SIZE}
        fontsByCategory={fontsByCategory}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf,image/*"
        multiple
        className={stylescanva.hiddenInput}
        onChange={handleFileInputChange}
      />

      <Axis canvasReady={canvasReady} onReady={handleAxisReady} />

      <div
        className={stylescanva.canvaWrapper}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <GridCanvas ref={gridRef} bgColor={gridBgColor} lineColor={gridLineColor} />
        <canvas
          id="canvas"
          className={stylescanva.canva}
          ref={canvasRef}
        />
        {isDragOver && (
          <div className={stylescanva.dragOverlay}>
            Solte o PDF ou imagem aqui
          </div>
        )}
      </div>

      {contextMenu.visible && (
        <ObjectContextMenu
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleLayerAction}
        />
      )}

      <Navbar />
    </div>
  );

}