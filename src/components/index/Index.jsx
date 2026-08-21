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


const MIN_PLANO_BRUSH           = 1;
const MIN_PLANO_MEDIA           = 2;
const MIN_PLANO_EXPORT_SVG      = 3; 
const MIN_PLANO_CANVAS_SETTINGS = 1; 

export default function Index() {
  const { id } = useParams();

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

  const [drawMode, setDrawMode]     = useState(null);
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize]   = useState(DEFAULT_BRUSH_SIZE);
  const [eraserSize, setEraserSizeState] = useState(DEFAULT_ERASER_SIZE);

  const [gridBgColor, setGridBgColor]     = useState(DEFAULT_GRID_BG_COLOR);
  const [gridLineColor, setGridLineColor] = useState(DEFAULT_GRID_LINE_COLOR);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const gridColorsRef = useRef({ bgColor: DEFAULT_GRID_BG_COLOR, lineColor: DEFAULT_GRID_LINE_COLOR });


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

    setGridBgColor(DEFAULT_GRID_BG_COLOR);
    setGridLineColor(DEFAULT_GRID_LINE_COLOR);

    const cs = new fabric.Canvas(canvasRef.current, {
      width:  window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "transparent",
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
      brush: brushRef.current,
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
  const addText      = () => { stopDrawing(); addTextToCanvas(canvasInstanceRef.current); };
  const addContainer = () => { stopDrawing(); addContainerToCanvas(canvasInstanceRef.current); };
  const openFilePicker = () => {
    if (!requirePlano(canImportMedia)) return;
    stopDrawing();
    fileInputRef.current?.click();
  };

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
          <ToolButton path={MODEL_PATHS.addBox}       modelKey="addBox"       label="Adicionar bloco" onClick={addBox} />
          <ToolButton path={MODEL_PATHS.addText}      modelKey="addText"      label="Adicionar texto" onClick={addText} />
          <ToolButton path={MODEL_PATHS.addContainer} modelKey="addContainer" label="Adicionar seção" onClick={addContainer} />
        </div>

        <div className={stylestoolbox.divider} />

        <div className={stylestoolbox.group}>
          <ToolButton path={MODEL_PATHS.center} modelKey="center" label="Centralizar"    onClick={centerCanvas} />
          <ToolButton
            path={MODEL_PATHS.media}
            modelKey="media"
            label="Importar mídia"
            locked={!canImportMedia}
            onClick={openFilePicker}
          />
        </div>

        <div className={stylestoolbox.divider} />

        <div className={stylestoolbox.group}>
          <ToolButton
            path={MODEL_PATHS.brush}
            modelKey="brush"
            label="Pincel (Esc para sair)"
            active={drawMode === "draw"}
            locked={!canUseBrush}
            onClick={toggleDraw}
          />
          <ToolButton
            path={MODEL_PATHS.eraser}
            modelKey="eraser"
            label="Borracha (Esc para sair)"
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

      <Navbar />
    </div>
  );

}