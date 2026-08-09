import * as fabric from "fabric";
import { generateId, SELECTION_STYLE, noRotate, containerBorderOnly } from "./constants";

// Distância (em px do canvas) que cada colagem sucessiva desloca os objetos,
// pra não empilhar tudo exatamente em cima do original.
const PASTE_STEP = 24;

// Fábrica de copiar/colar. Recebe a instância do canvas e salvarMapa (pra
// persistir automaticamente após colar, igual às outras ações do canvas).
export function createClipboard({ cs, salvarMapa }) {
  let clipboard = [];   // guarda os últimos objetos copiados (clones "mestre")
  let pasteOffset = 0;  // acumula o deslocamento a cada Ctrl+V repetido

  // Cards de mídia (useMediaImporter) são um fabric.Group com filhos numa
  // ordem fixa: [bg, ...preview, text, downloadBtnBg, downloadBtnIcon].
  // Os underscore-props (_isBackground, _isDownloadBtn) não sobrevivem ao
  // clone() automático do Fabric, então precisam ser re-marcados por
  // posição depois de clonar.
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

    // ActiveSelection (múltiplos objetos) ou objeto único
    let sources = active.type === "activeselection" ? active.getObjects() : [active];

    // Portas e linhas de conexão não fazem sentido copiar isoladamente
    sources = sources.filter((o) => !o._isPort && !o.isLine);
    if (!sources.length) return;

    const items = [];
    for (const obj of sources) {
      const clone = await obj.clone();

      // Underscore-props custom não são preservadas pelo clone() padrão do
      // Fabric (mesmo motivo pelo qual usePersistence.js reanexa tudo isso
      // manualmente depois do toJSON()) — então reanexamos aqui também.
      clone._blockType = obj._blockType;
      clone._isLabel   = obj._isLabel;

      // Blocos do tipo "group" (addGroup) são dois objetos separados: o
      // label (Textbox, selecionável) linkado a um bg (Rect, não
      // selecionável) via _linkedBg/_linkedLabel. Precisamos clonar o bg
      // junto, mesmo ele não estando na seleção do usuário.
      //
      // Container (addContainer) é o mesmo par bg/label, só que com os
      // papéis invertidos: o retângulo (_isBackground) é o principal e o
      // nome (_linkedLabel) é quem precisa ser clonado junto.
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
    pasteOffset = 0; // zera o deslocamento a cada nova cópia
  }

  async function pasteClipboard() {
    if (!clipboard.length) return;
    pasteOffset += PASTE_STEP;

    const pasted = [];

    for (const { clone, bgClone } of clipboard) {
      // Clona de novo a partir do "mestre" guardado, assim dá pra colar
      // (Ctrl+V) várias vezes sem reutilizar a mesma instância de objeto.
      const objCopy = await clone.clone();
      objCopy.set({
        ...SELECTION_STYLE,
        left: clone.left + pasteOffset,
        top:  clone.top  + pasteOffset,
      });

      objCopy._id        = generateId(); // novo id: nunca reaproveita o do original
      objCopy._blockType = clone._blockType;
      objCopy._isLabel    = clone._isLabel;
      noRotate(objCopy);
      // Container clonado perde o override de containsPoint (clone() recria
      // a instância via toObject/fromObject) — reaplica aqui. Ver constants.js.
      if (clone._blockType === "container") containerBorderOnly(objCopy);

      if (clone._blockType === "media") {
        objCopy._isPdf      = clone._isPdf;
        objCopy._sourceName = clone._sourceName;
        objCopy._pdfDataUrl = clone._pdfDataUrl;
        objCopy.subTargetCheck = true; // necessário pro botão de download funcionar
        retagMediaChildren(objCopy);
      }

      cs.add(objCopy);
      if (objCopy._blockType === "container") cs.sendObjectToBack(objCopy); // mantém o container atrás, igual na criação

      // Recria o par label+bg pro blockType "group"
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
      }

      // Recria o par retângulo+nome pro blockType "container" (papéis
      // invertidos em relação ao "group": objCopy aqui já É o retângulo,
      // e o parceiro clonado (bgClone) é o nome/label).
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
      }

      pasted.push(objCopy);
    }

    // Seleciona o que acabou de ser colado (objeto único ou ActiveSelection)
    cs.discardActiveObject();
    if (pasted.length === 1) {
      cs.setActiveObject(pasted[0]);
    } else if (pasted.length > 1) {
      const sel = new fabric.ActiveSelection(pasted, { canvas: cs });
      cs.setActiveObject(sel);
    }

    cs.requestRenderAll();
    salvarMapa?.(); // persiste igual às outras ações (deletar, conectar, etc.)
  }

  return { copySelection, pasteClipboard };
}