import * as fabric from "fabric";
import { generateId, SELECTION_STYLE, noRotate, containerBorderOnly } from "./constants";
import { makeAddAction, combineActions } from "./useHistory";

const PASTE_STEP = 24;

export function createClipboard({ cs, salvarMapa, history }) {
  let clipboard = [];
  let pasteOffset = 0;

  const retagMediaChildren = (group) => {
    const children = group.getObjects();
    if (!children.length) return;
    children[0]._isBackground = true;
    children[children.length - 2]._isDownloadBtn = true;
    children[children.length - 1]._isDownloadBtn = true;
  };

  async function copySelection() {
    const active = cs.getActiveObject();
    if (!active) return;

    let sources = active.type === "activeselection" ? active.getObjects() : [active];
    sources = sources.filter((o) => !o._isPort && !o.isLine && !o._isDrawing);
    if (!sources.length) return;

    const items = [];
    for (const obj of sources) {
      const clone = await obj.clone();
      clone._blockType = obj._blockType;
      clone._isLabel   = obj._isLabel;

      let bgClone = null;
      if (obj._blockType === "group" && obj._isLabel && obj._linkedBg) {
        bgClone = await obj._linkedBg.clone();
      } else if (obj._blockType === "container" && obj._linkedLabel) {
        bgClone = await obj._linkedLabel.clone();
      }

      if (obj._blockType === "media") {
        clone._isPdf      = obj._isPdf;
        clone._sourceName = obj._sourceName;
        clone._pdfDataUrl = obj._pdfDataUrl;
      }

      items.push({ clone, bgClone });
    }

    clipboard = items;
    pasteOffset = 0;
  }

  async function pasteClipboard() {
    if (!clipboard.length) return;
    pasteOffset += PASTE_STEP;

    const pasted = [];
    const actions = [];

    for (const { clone, bgClone } of clipboard) {
      const objCopy = await clone.clone();
      objCopy.set({
        ...SELECTION_STYLE,
        left: clone.left + pasteOffset,
        top:  clone.top  + pasteOffset,
      });

      objCopy._id        = generateId();
      objCopy._blockType = clone._blockType;
      objCopy._isLabel    = clone._isLabel;
      noRotate(objCopy);

      if (clone._blockType === "container") containerBorderOnly(objCopy);

      if (clone._blockType === "media") {
        objCopy._isPdf      = clone._isPdf;
        objCopy._sourceName = clone._sourceName;
        objCopy._pdfDataUrl = clone._pdfDataUrl;
        objCopy.subTargetCheck = true;
        retagMediaChildren(objCopy);
      }

      cs.add(objCopy);
      const isContainer = objCopy._blockType === "container";
      if (isContainer) cs.sendObjectToBack(objCopy);
      actions.push(makeAddAction(cs, objCopy, { toBack: isContainer }));

      if (clone._blockType === "group" && clone._isLabel && bgClone) {
        const bgCopy = await bgClone.clone();
        bgCopy.set({
          left: bgClone.left + pasteOffset,
          top:  bgClone.top  + pasteOffset,
          selectable: false,
          evented: false,
        });
        bgCopy._id           = generateId();
        bgCopy._isBackground  = true;
        bgCopy._linkedLabel   = objCopy;
        objCopy._linkedBg     = bgCopy;
        noRotate(bgCopy);

        cs.add(bgCopy);
        cs.sendObjectToBack(bgCopy);
        actions.push(makeAddAction(cs, bgCopy, { toBack: true }));
      }

      if (clone._blockType === "container" && bgClone) {
        const labelCopy = await bgClone.clone();
        labelCopy.set({
          left: bgClone.left + pasteOffset,
          top:  bgClone.top  + pasteOffset,
          selectable: false,
          evented: false,
        });
        labelCopy._id               = generateId();
        labelCopy._blockType        = "containerLabel";
        labelCopy._isLabel          = true;
        labelCopy._isContainerLabel = true;
        labelCopy._linkedBg         = objCopy;
        objCopy._linkedLabel        = labelCopy;
        objCopy._isBackground       = true;

        cs.add(labelCopy);
        actions.push(makeAddAction(cs, labelCopy));
      }

      pasted.push(objCopy);
    }

    history?.push(combineActions(actions));

    cs.discardActiveObject();
    if (pasted.length === 1) {
      cs.setActiveObject(pasted[0]);
    } else if (pasted.length > 1) {
      const sel = new fabric.ActiveSelection(pasted, { canvas: cs });
      cs.setActiveObject(sel);
    }

    cs.requestRenderAll();
    salvarMapa?.();
  }

  return { copySelection, pasteClipboard };
}