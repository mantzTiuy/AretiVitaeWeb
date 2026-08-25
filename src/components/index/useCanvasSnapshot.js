import {
  generateId,
  noRotate,
  containerBorderOnly,
  tagDrawing,
  SELECTION_STYLE,
} from "./constants";
import { loadGoogleFont } from "./loadGoogleFont";

export function serializeCanvasState(cs, { gridColorsRef } = {}) {
  cs.getObjects().forEach((obj) => {
    if (obj._isPort || obj.isLine) return;
    if (!obj._id) obj._id = generateId();
  });

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
        toSide: conn.toSide,
        color: conn.line?.stroke,
        strokeWidth: conn.line?.strokeWidth,
      });
    });
  });

  const canvasJson = cs.toJSON();
  const liveObjects = cs.getObjects();
  const enrichedObjects = [];
  liveObjects.forEach((obj, i) => {
    if (obj._isPort || obj.isLine) return;
    const json = canvasJson.objects[i];
    if (!json) return;

    json.blockId = obj._id;
    json.blockType = obj._blockType ?? null;
    json.isLabel = obj._isLabel ?? false;
    json.isBackground = obj._isBackground ?? false;
    json.linkedId =
      obj._isLabel && obj._linkedBg
        ? (obj._linkedBg._id ?? null)
        : obj._isBackground && obj._linkedLabel
        ? (obj._linkedLabel._id ?? null)
        : null;

    if (obj._blockType === "media") {
      json.isPdf = obj._isPdf ?? false;
      json.sourceName = obj._sourceName ?? null;
      if (obj._isPdf) {
        json.pdfDataUrl = obj._pdfDataUrl ?? null;
      }
    }

    enrichedObjects.push(json);
  });
  canvasJson.objects = enrichedObjects;

  return {
    canvasJson,
    connections,
    gridColors: gridColorsRef?.current ?? null,
  };
}

export async function restoreCanvasState(
  cs,
  { canvasJson, connections = [], gridColors = null },
  { createConnection, setGridColors, isLoadingFromJsonRef }
) {
  if (gridColors && setGridColors) {
    setGridColors({
      bgColor: gridColors.bgColor,
      lineColor: gridColors.lineColor,
    });
  }

  if (isLoadingFromJsonRef) isLoadingFromJsonRef.current = true;
  await cs.loadFromJSON(canvasJson);
  if (isLoadingFromJsonRef) isLoadingFromJsonRef.current = false;

  const savedObjects = canvasJson.objects ?? [];
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
      obj._id = blockId;
      obj._blockType = obj.blockType ?? meta?.blockType ?? obj._blockType;
      obj._isLabel = obj.isLabel ?? meta?.isLabel ?? false;
      obj._isBackground = obj.isBackground ?? meta?.isBackground ?? false;
      obj._linkedIdRaw = obj.linkedId ?? meta?.linkedId ?? null;

      if (obj._blockType === "media") {
        obj._isPdf = obj.isPdf ?? meta?.isPdf ?? false;
        obj._sourceName = obj.sourceName ?? meta?.sourceName ?? null;
        obj._pdfDataUrl = obj.pdfDataUrl ?? meta?.pdfDataUrl ?? null;
      }
    } else if (!obj._id && !obj._isPort && !obj.isLine) {
      obj._id = generateId();
    }

    if (!obj._isPort && !obj.isLine) {
      if (obj._blockType === "drawing") {
        tagDrawing(obj);
        cs.sendObjectToBack(obj);
      } else {
        obj.set(SELECTION_STYLE);
        noRotate(obj);
        if (obj._blockType === "container") containerBorderOnly(obj);
      }
    }
  });

  const usedFonts = new Set();
  cs.getObjects().forEach((obj) => {
    if (obj.type === "textbox" && obj.fontFamily) usedFonts.add(obj.fontFamily);
  });
  usedFonts.forEach((font) => {
    loadGoogleFont(font, () => cs.requestRenderAll());
  });

  const objById = {};
  cs.getObjects().forEach((obj) => {
    if (obj._id) objById[obj._id] = obj;
  });

  cs.getObjects().forEach((obj) => {
    if (!obj._linkedIdRaw) return;
    const other = objById[obj._linkedIdRaw];
    if (!other) return;
    if (obj._isLabel) {
      obj._linkedBg = other;
      other._linkedLabel = obj;
    } else if (obj._isBackground) {
      obj._linkedLabel = other;
      other._linkedBg = obj;
    }
  });

  cs.getObjects()
    .filter((o) => o.isLine)
    .forEach((l) => cs.remove(l));

  cs.renderAll();
  cs.getObjects().forEach((obj) => obj.setCoords());

  connections.forEach(({ sourceId, targetId, fromSide, toSide, color, strokeWidth }) => {
    const source = objById[sourceId];
    const dest = objById[targetId];
    if (!source || !dest) {
      console.warn("Bloco não encontrado:", sourceId, targetId);
      return;
    }
    createConnection(source, dest, fromSide, toSide, { color, strokeWidth });
  });

  cs.requestRenderAll();
}