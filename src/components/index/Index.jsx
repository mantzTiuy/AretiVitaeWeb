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
  addGroup as addGroupToCanvas,
  addText as addTextToCanvas,
  addContainer as addContainerToCanvas,
} from "./useBlockFactories";
import { createCanvasInteractions } from "./useCanvasInteractions";
import { createClipboard } from "./useClipboard";
import { exportCanvasAsSVG } from "./useSvgExport";

export default function Index() {
  const { id } = useParams(); // Informação vinda da url, pega o id DO CANVAS

  const canvasRef         = useRef(null);
  const gridRef           = useRef(null);
  const canvasInstanceRef = useRef(null);
  const sourceBlockRef    = useRef(null); // Guarda temporariamente o bloco/lado quando existe dragging de porta
  const mediaImporterRef  = useRef(null); // Ref das mídias (importador de PDF/imagem)
  const brushRef          = useRef(null); // Ref do módulo de desenho (createBrush: pincel/borracha/undo)
  const fileInputRef      = useRef(null); // Input escondido pra seleção manual de PDF/imagem
  const [isDragOver, setIsDragOver] = useState(false); // feedback visual do drop do pdf
  const tempLineRef       = useRef(null); // Linha temporária para definir conexão entre portas
  const isDraggingPort    = useRef(false); // Define se está ou não em um "estado de arrasto"
  const activePortsRef    = useRef([]); // Array com as portas selecionadas
  const checkAlignmentRef = useRef(null); // Checa o alinhamento referente ao componente Axis.jsx
  const [canvasReady, setCanvasReady] = useState(null); // State porque precisa renderizar várias vezes
  const [_loadingMap, setLoadingMap]  = useState(true);
  const [erroMap, setErroMap]         = useState('');
  const [saveStatus, setSaveStatus]   = useState('IDLE');
  const saveTimeoutRef       = useRef(null);
  const isLoadingFromJsonRef = useRef(false);

  // ── Estado do modo pincel/borracha ──────────────────────────────────────
  // "draw" | "erase" | null — os dois modos são mutuamente exclusivos entre
  // si e com qualquer outra ferramenta (addBox, addGroup, mídia etc).
  const [drawMode, setDrawMode]     = useState(null);
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize]   = useState(DEFAULT_BRUSH_SIZE);
  const [eraserSize, setEraserSizeState] = useState(DEFAULT_ERASER_SIZE);

  // ── Cores do canvas (fundo + grade) ─────────────────────────────────────
  // Editável via botão "config" (CanvasSettingsPanel) e persistido no JSON
  // salvo (usePersistence.js -> gridColors).
  const [gridBgColor, setGridBgColor]     = useState(DEFAULT_GRID_BG_COLOR);
  const [gridLineColor, setGridLineColor] = useState(DEFAULT_GRID_LINE_COLOR);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const gridColorsRef = useRef({ bgColor: DEFAULT_GRID_BG_COLOR, lineColor: DEFAULT_GRID_LINE_COLOR });

  useEffect(() => {
    gridColorsRef.current = { bgColor: gridBgColor, lineColor: gridLineColor };
  }, [gridBgColor, gridLineColor]);

  // Permite que os Axis não sejam reconstruídos no f5, por causa do useCallback
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

    // Reseta pro padrão sempre que troca de mapa (id) — evita herdar cores
    // de um mapa anterior até carregarMapa terminar (se o novo mapa nem
    // tiver gridColors salvo, fica no padrão mesmo).
    setGridBgColor(DEFAULT_GRID_BG_COLOR);
    setGridLineColor(DEFAULT_GRID_LINE_COLOR);

    const cs = new fabric.Canvas(canvasRef.current, {
      width:  window.innerWidth,
      height: window.innerHeight,
      // Transparente: quem desenha o fundo/grade visível agora é sempre o
      // GridCanvas, com cores configuráveis (CanvasSettingsPanel) — a cor
      // fixa que existia aqui antes não tinha como ser trocada pelo usuário.
      backgroundColor: "transparent",
    });

    const drawGrid = () => {
      gridRef.current?.redraw(cs.viewportTransform, cs.getZoom());
    };
    cs.on("after:render", drawGrid);

    // Instaura um id para cada objeto, garantindo integridade das conexões no reload
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

    const clipboard = createClipboard({ cs, salvarMapa });

    mediaImporterRef.current = createMediaImporter({ cs, salvarMapa });


    brushRef.current = createBrush(cs, { salvarMapa });

    const cancelledRef = { current: false };
    carregarMapa(cs, cancelledRef);

    const interactions = createCanvasInteractions({
      cs,
      sourceBlockRef,
      tempLineRef,
      isDraggingPort,
      checkAlignmentRef,
      ports,
      salvarMapa,
      clipboard,
      brush: brushRef.current, // Ctrl+Z / Ctrl+Shift+Z desfazem/refazem o desenho
    });


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

    const onKeyDown = (e) => interactions.onKeyDown(e, canvasInstanceRef);
    const disableCtrlZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };

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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel",   disableCtrlZoom, { passive: false });

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
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel",   disableCtrlZoom);
      window.removeEventListener("resize",  handleResize);
      brushRef.current?.destroy();
      brushRef.current = null;
      canvasInstanceRef.current = null;
      cs.dispose();
    };
  }, [id]);


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.length) {
      mediaImporterRef.current?.handleFiles(e.dataTransfer.files);
    }
  };

  const handleSalvarManual = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    canvasInstanceRef.current?.salvarMapa?.();
  };


  const handleExportSVG = () => {
    exportCanvasAsSVG(canvasInstanceRef.current, "mapa.svg");
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


  const stopDrawing = () => {
    setDrawMode(null);
    brushRef.current?.disable();
  };

  const toggleDraw = () => {
    if (drawMode === "draw") {
      stopDrawing();
      return;
    }
    setDrawMode("draw");
    brushRef.current?.enable({ color: brushColor, size: brushSize });
  };

  const toggleErase = () => {
    if (drawMode === "erase") {
      stopDrawing();
      return;
    }
    setDrawMode("erase");
    brushRef.current?.enableErase({ size: eraserSize });
  };

  const handleBrushColorChange = (e) => {
    const value = e.target.value;
    setBrushColor(value);
    brushRef.current?.setColor(value);
  };

  const handleBrushSizeChange = (e) => {
    const value = Number(e.target.value);
    setBrushSize(value);
    brushRef.current?.setSize(value);
  };

  const handleEraserSizeChange = (e) => {
    const value = Number(e.target.value);
    setEraserSizeState(value);
    brushRef.current?.setEraserSize(value);
  };

  const handleUndo = () => brushRef.current?.undo();
  const handleRedo = () => brushRef.current?.redo();

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape" && drawMode) stopDrawing();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);

  }, [drawMode]);

  const addBox       = () => { stopDrawing(); addBoxToCanvas(canvasInstanceRef.current); };
  const addGroup     = () => { stopDrawing(); addGroupToCanvas(canvasInstanceRef.current); };
  const addText      = () => { stopDrawing(); addTextToCanvas(canvasInstanceRef.current); };
  const addContainer = () => { stopDrawing(); addContainerToCanvas(canvasInstanceRef.current); };
  const openFilePicker = () => { stopDrawing(); fileInputRef.current?.click(); };

  const handleFileInputChange = (e) => {
    if (e.target.files?.length) {
      mediaImporterRef.current?.handleFiles(e.target.files);
    }
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois
  };

 return (
    <div className="App">
      {erroMap && (
        <div className={stylescanva.errorMessage}>
          {erroMap}
        </div>
      )}

      <div className={stylestoolbox.toolbox}>
        <button onClick={addGroup}           className={stylestoolbox.button}>addg</button>
        <button onClick={addBox}             className={stylestoolbox.button}>addb</button>
        <button onClick={addText}            className={stylestoolbox.button}>addt</button>
        <button onClick={addContainer}       className={stylestoolbox.button}>addc</button>
        <button onClick={centerCanvas}       className={stylestoolbox.button}>center</button>
        <button onClick={openFilePicker}     className={stylestoolbox.button}>midia</button>

        <button
          onClick={toggleDraw}
          className={stylestoolbox.button}
          style={drawMode === "draw" ? { outline: "2px solid #5083ef" } : undefined}
          title="Pincel (Esc para sair)"
        >
          {drawMode === "draw" ? "pincel ✓" : "pincel"}
        </button>
        {drawMode === "draw" && (
          <>
            <input
              type="color"
              value={brushColor}
              onChange={handleBrushColorChange}
              title="Cor do pincel"
              className={stylestoolbox.button}
            />
            <input
              type="range"
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              value={brushSize}
              onChange={handleBrushSizeChange}
              title={`Espessura: ${brushSize}px`}
            />
          </>
        )}

        <button
          onClick={toggleErase}
          className={stylestoolbox.button}
          style={drawMode === "erase" ? { outline: "2px solid #5083ef" } : undefined}
          title="Borracha (Esc para sair) — apaga só traços de pincel"
        >
          {drawMode === "erase" ? "borracha ✓" : "borracha"}
        </button>
        {drawMode === "erase" && (
          <input
            type="range"
            min={MIN_ERASER_SIZE}
            max={MAX_ERASER_SIZE}
            value={eraserSize}
            onChange={handleEraserSizeChange}
            title={`Tamanho da borracha: ${eraserSize}px`}
          />
        )}

        <button onClick={handleUndo} className={stylestoolbox.button} title="Desfazer (Ctrl+Z)">
          desfazer
        </button>
        <button onClick={handleRedo} className={stylestoolbox.button} title="Refazer (Ctrl+Shift+Z)">
          refazer
        </button>

        <button onClick={handleSalvarManual} className={stylestoolbox.button}>
          {saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={handleExportSVG}    className={stylestoolbox.button}>SVG</button>

        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            onClick={() => setShowCanvasSettings((v) => !v)}
            className={stylestoolbox.button}
            title="Configurações do canvas (fundo e grade)"
          >
            {showCanvasSettings ? "config ✓" : "config"}
          </button>
          <CanvasSettingsPanel
            open={showCanvasSettings}
            onClose={() => setShowCanvasSettings(false)}
            bgColor={gridBgColor}
            lineColor={gridLineColor}
            onBgColorChange={handleGridBgColorChange}
            onLineColorChange={handleGridLineColorChange}
            onReset={handleResetGridColors}
          />
        </div>

        <Settings canvasRef={canvasInstanceRef} canvasReady={canvasReady} />
      </div>

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

      <Navbar />
    </div>
  );
}