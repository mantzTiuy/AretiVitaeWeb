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
import { createMediaImporter } from "./useMediaImporter";

import { generateId, SELECTION_STYLE } from "./constants";
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

export default function Index() {
  const { id } = useParams(); // Informação vinda da url, pega o id DO CANVAS

  const canvasRef         = useRef(null);
  const gridRef           = useRef(null);
  const canvasInstanceRef = useRef(null);
  const sourceBlockRef    = useRef(null); // Guarda temporariamente o bloco/lado quando existe dragging de porta
  const mediaImporterRef  = useRef(null); // Ref das mídias (importador de PDF/imagem)
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
    const cs = new fabric.Canvas(canvasRef.current, {
      width:           window.innerWidth,
      height:          window.innerHeight,
      backgroundColor: "#eaf4fc",
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

    // CORREÇÃO (qualidade/nitidez): antes esta função escrevia direto em
    // cs.width e em upperCanvas/lowerCanvas.width/height usando os pixels
    // CSS (window.innerWidth/innerHeight) crus. O Fabric, por padrão, já usa
    // retina scaling: o buffer real de pixels é dimensionado em
    // largura_css * devicePixelRatio, o que é o que garante texto e bordas
    // nítidas em telas com DPR > 1 (Mac retina, Windows com escala 125%/
    // 150%, celular etc.). Sobrescrever manualmente esses valores anulava
    // esse scaling e fazia o canvas voltar a renderizar em 1:1, esticado via
    // CSS — daí o aspecto borrado nos cards. cs.setDimensions() delega esse
    // cálculo pro próprio Fabric, preservando a escala retina.
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

    // ── Módulos ────────────────────────────────────────────────────────────
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
    });
    const { salvarMapa, carregarMapa } = persistence;

    canvasInstanceRef.current.salvarMapa = salvarMapa;

    // Copiar/colar (Ctrl+C / Ctrl+V) — precisa vir depois de salvarMapa
    // existir, já que a colagem persiste automaticamente igual às outras
    // ações do canvas (deletar, conectar, etc.)
    const clipboard = createClipboard({ cs, salvarMapa });

    // Importador de mídias (PDF/imagem) — mesmo padrão dos outros módulos
    mediaImporterRef.current = createMediaImporter({ cs, salvarMapa });

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
    });

    // ── Download de mídia: botão desenhado no card + duplo clique como atalho ──
    // O botão é detectado via opt.subTargets no "mouse:up" (equivalente a um
    // click, sem interferir no início de um drag no "mouse:down"
    // Precisa de subTargetCheck: true no group (já configurado em
    // buildMediaCard) pra que o fabric preencha subTargets com os objetos
    // marcados _isDownloadBtn. :D
    const onMediaMouseUp = (opt) => {
      const clickedBtn = opt.subTargets?.some((o) => o._isDownloadBtn);
      if (clickedBtn && opt.target?._blockType === "media") {
        mediaImporterRef.current?.downloadMediaImage(opt.target);
      }
    };

    // Atalho: duplo clique em qualquer parte do card também baixa,
    // não só quando acerta o botão em cima. Pra facilitar considerando que o botão pode ser dificil de ver
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
      canvasInstanceRef.current = null;
      cs.dispose();
    };
  }, [id]);

  //Drag & drop de PDF ou Imagem
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

  // Seleção manual de mídia (botão), alternativa ao drag-and-drop 
  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileInputChange = (e) => {
    if (e.target.files?.length) {
      mediaImporterRef.current?.handleFiles(e.target.files);
    }
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois
  };

  const addBox       = () => addBoxToCanvas(canvasInstanceRef.current);
  const addGroup     = () => addGroupToCanvas(canvasInstanceRef.current);
  const addText      = () => addTextToCanvas(canvasInstanceRef.current);
  const addContainer = () => addContainerToCanvas(canvasInstanceRef.current);

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
        <button onClick={handleSalvarManual} className={stylestoolbox.button}>
          {saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
        </button>
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
        <GridCanvas ref={gridRef} />
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