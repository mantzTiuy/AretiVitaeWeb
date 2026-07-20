import * as fabric from "fabric";
import { SELECTION_STYLE } from "./constants";

//  Aparência do bloquinho
const CARD = {
  width: 160,
  padding: 10,
  thumbHeight: 130,
  labelHeight: 34,
  fill: "#ffffff",
  stroke: "#e2e4ea",
};

// Aparência do botão de download
const DOWNLOAD_BTN = {
  radius: 11, // mantém a área clicável, só que invisível (sem fill)
  icon: "#f2f3f5",
  iconHover: "#ffffff",
};

// Aparência do placeholder de PDF (sem preview de conteúdo)
const PDF_PLACEHOLDER = {
  fill: "#eceef3",
  icon: "#7a7f8c",
};

export function createMediaImporter({ cs, salvarMapa }) {
  let importOffset = 0;

  function triggerDownload(dataUrl, filename) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function buildMediaCard(imgEl, label, meta = {}) {
    const isPdf = !!meta.isPdf;
    const innerW = CARD.width - CARD.padding * 2;
    const cardHeight = CARD.thumbHeight + CARD.labelHeight + CARD.padding * 2;

    const bg = new fabric.Rect({
      width: CARD.width,
      height: cardHeight,
      fill: CARD.fill,
      stroke: CARD.stroke,
      strokeWidth: 1,
      shadow: null,
      originX: "left",
      originY: "top",
      _isBackground: true,
    });

    let previewObjects;
    if (isPdf) {
      const placeholder = new fabric.Rect({
        width: innerW,
        height: CARD.thumbHeight,
        left: CARD.width / 2,
        top: CARD.padding,
        originX: "center",
        originY: "top",
        rx: 6,
        ry: 6,
        fill: PDF_PLACEHOLDER.fill,
      });
      const icon = new fabric.Text("PDF", {
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Segoe UI, system-ui, sans-serif",
        fill: PDF_PLACEHOLDER.icon,
        left: CARD.width / 2,
        top: CARD.padding + CARD.thumbHeight / 2,
        originX: "center",
        originY: "center",
      });
      previewObjects = [placeholder, icon];
    } else {
      const scale = Math.min(innerW / imgEl.width, CARD.thumbHeight / imgEl.height);
      const fabricImg = new fabric.Image(imgEl, {
        originX: "center",
        originY: "top",
        left: CARD.width / 2,
        top: CARD.padding,
        scaleX: scale,
        scaleY: scale,
      });
      fabricImg.clipPath = new fabric.Rect({
        width: imgEl.width,
        height: imgEl.height,
        originX: "center",
        originY: "center",
      });
      previewObjects = [fabricImg];
    }

    const text = new fabric.Text(label, {
      fontSize: 11,
      fontFamily: "Segoe UI, system-ui, sans-serif",
      fill: "#5b5e68",
      originX: "center",
      originY: "top",
      left: CARD.width / 2,
      top: CARD.padding + CARD.thumbHeight + 8,
      width: innerW,
      textAlign: "center",
    });
    if (text.width > innerW) {
      let t = label;
      while (t.length > 4 && new fabric.Text(t + "…", {
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
      }).width > innerW) {
        t = t.slice(0, -1);
      }
      text.set("text", t.length < label.length ? t + "…" : label);
    }

    const btnCx = CARD.width - CARD.padding - DOWNLOAD_BTN.radius;
    const btnCy = CARD.padding + DOWNLOAD_BTN.radius;

  
    const downloadBtnBg = new fabric.Circle({
      radius: DOWNLOAD_BTN.radius,
      left: btnCx,
      top: btnCy,
      originX: "center",
      originY: "center",
      fill: "transparent",
      stroke: "transparent",
      shadow: null,
      hoverCursor: "pointer",
      _isDownloadBtn: true,
    });

   
    const downloadBtnIcon = new fabric.Text("↓", {
      fontSize: 17,
      fontWeight: "700",
      fontFamily: "Segoe UI, system-ui, sans-serif",
      fill: DOWNLOAD_BTN.icon,
      shadow: null,
      left: btnCx,
      top: btnCy - 1,
      originX: "center",
      originY: "center",
      hoverCursor: "pointer",
      _isDownloadBtn: true,
    });

    const vpCenter = cs.getVpCenter();
    const baseLeft = vpCenter.x - CARD.width / 2;
    const baseTop  = vpCenter.y - cardHeight / 2;

    const group = new fabric.Group(
      [bg, ...previewObjects, text, downloadBtnBg, downloadBtnIcon],
      {
        ...SELECTION_STYLE,
        left: baseLeft + importOffset,
        top: baseTop + importOffset,
        subTargetCheck: true,
        lockRotation: true,
        hasRotatingPoint: false,
        _blockType: "media",
        _sourceName: meta.sourceName,
        _isPdf: isPdf,
        _pdfDataUrl: meta.pdfDataUrl,
      }
    );

    cs.add(group);
    cs.setActiveObject(group);
    cs.requestRenderAll();

    importOffset = (importOffset + 22) % 140;
    return group;
  }

  function importImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgEl = new Image();
        imgEl.onload = () => {
          buildMediaCard(imgEl, file.name, { sourceName: file.name });
          resolve();
        };
        imgEl.onerror = reject;
        imgEl.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function importPdf(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        buildMediaCard(null, file.name, {
          sourceName: file.name,
          isPdf: true,
          pdfDataUrl: e.target.result,
        });
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    let importedAny = false;

    for (const file of files) {
      try {
        if (file.type === "application/pdf") {
          await importPdf(file);
          importedAny = true;
        } else if (file.type.startsWith("image/")) {
          await importImage(file);
          importedAny = true;
        } else {
          console.warn(`Tipo não suportado: ${file.name}`);
        }
      } catch (err) {
        console.error(`Erro ao importar ${file.name}:`, err);
      }
    }

    if (importedAny) salvarMapa?.();
  }

  function downloadMediaImage(group) {
    if (!group || group._blockType !== "media") return;

    if (group._isPdf) {
      const dataUrl = group._pdfDataUrl;
      if (!dataUrl) return;
      triggerDownload(dataUrl, group._sourceName || "documento.pdf");
      return;
    }

    const fabricImg = group._objects?.find((o) => o.type === "image");
    const el = fabricImg?.getElement ? fabricImg.getElement() : fabricImg?._element;
    const dataUrl = el?.src;
    if (!dataUrl) return;

    const base = group._sourceName
      ? group._sourceName.replace(/\.[^/.]+$/, "")
      : "imagem";

    triggerDownload(dataUrl, `${base}.png`);
  }

  return { handleFiles, importImage, importPdf, downloadMediaImage };
}