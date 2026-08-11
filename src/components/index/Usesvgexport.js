

const EXPORT_PADDING = 40; 

function getContentBounds(cs) {

  const objects = cs.getObjects().filter((o) => !o._isPort && !o._isGuide);
  if (!objects.length) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  objects.forEach((obj) => {
    obj.setCoords();
  
    const rect = obj.getBoundingRect(true, true);
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.left + rect.width);
    maxY = Math.max(maxY, rect.top + rect.height);
  });

  return { minX, minY, maxX, maxY };
}

export function exportCanvasAsSVG(cs, filename = "mapa.svg") {
  if (!cs) return;


  cs.discardActiveObject();
  cs.requestRenderAll();

  const bounds = getContentBounds(cs);
  if (!bounds) {
    alert("O canvas está vazio — não há nada para exportar.");
    return;
  }

  const width  = Math.round(bounds.maxX - bounds.minX + EXPORT_PADDING * 2);
  const height = Math.round(bounds.maxY - bounds.minY + EXPORT_PADDING * 2);

  const svgString = cs.toSVG({
    viewBox: {
      x:      Math.round(bounds.minX - EXPORT_PADDING),
      y:      Math.round(bounds.minY - EXPORT_PADDING),
      width,
      height,
    },
    width:  `${width}`,
    height: `${height}`,
  });

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url  = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}