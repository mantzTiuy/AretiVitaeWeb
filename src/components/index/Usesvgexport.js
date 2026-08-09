// Exporta o canvas como SVG, recortado só na área que tem conteúdo — o
// canvas de trabalho é gigante (5000x5000, ver PAN_LIMIT em
// useCanvasInteractions.js), então exportar do jeito que o Fabric faz por
// padrão (viewBox = dimensões inteiras do canvas) gerava um SVG enorme,
// quase todo vazio.
//
// Estratégia: calcula o bounding box ABSOLUTO (sem viewportTransform, ou
// seja, ignorando o pan/zoom atual da tela) de todos os objetos "reais" do
// canvas, e usa isso como viewBox/width/height do toSVG — em vez do
// tamanho default do canvas inteiro.

const EXPORT_PADDING = 40; // margem (px do canvas) ao redor do conteúdo

function getContentBounds(cs) {
  // Portas (_isPort) e guias de alinhamento (_isGuide) são artefatos de
  // interação, nunca deveriam entrar no SVG nem no cálculo do recorte.
  const objects = cs.getObjects().filter((o) => !o._isPort && !o._isGuide);
  if (!objects.length) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  objects.forEach((obj) => {
    obj.setCoords();
    // absolute=true → ignora viewportTransform (pan/zoom da tela no
    // momento do clique), pega a posição "real" no espaço do canvas, que
    // é o mesmo espaço de coordenadas que o toSVG usa.
    // calculate=true → força recálculo, não usa cache antigo.
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

  // Descarta seleção ativa antes de medir/exportar: isso já dispara
  // selection:cleared, que por sua vez limpa as portas (usePortsAndConnections)
  // e as guias de alinhamento (Axis.jsx) — garantindo que nenhuma sobre pro
  // SVG mesmo que o usuário clique em "exportar" com algo selecionado.
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