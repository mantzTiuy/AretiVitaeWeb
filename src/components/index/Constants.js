import { getAbsoluteCenter } from "./geometry";

// Gerador de ids para os blocos, não é 100% seguro, mas não depende de nada,
// os blocos podem ter conflitos de id em alguns casos, mesmo que absolutamente improvavel.
export const generateId = () => Math.random().toString(36).slice(2, 10);

// APARENCIA DOS REDIMENCIONADORES, (não das portas)
// lockRotation + hasRotatingPoint ficam aqui (e não espalhados por cada
// fábrica de bloco) porque SELECTION_STYLE é usado em TODO objeto do canvas
// (box, group/texto, texto solto e cards de mídia/PDF). Antes disso ficava
// setado manualmente só em alguns lugares (addBox, addGroup), então
// addText e os cards de mídia (useMediaImporter.js) acabavam sem a trava
// e mostravam o handle de rotação.
export const SELECTION_STYLE = {
  cornerColor: "#5083ef",
  cornerStrokeColor: "#ffffff",
  cornerSize: 8,
  cornerStyle: "square",
  transparentCorners: false,
  borderColor: "#5083ef",
  borderDashArray: [4, 4],
  padding: 4,
  lockRotation: true,
  hasRotatingPoint: false,
  rotatingPointOffset: 0,
};

// Informações básicas das portas
export const PORT_RADIUS_BASE = 5;
export const PORT_FILL = "#93c5fd";
export const PORT_STROKE = "#fff";

// Limites de escala dos blocos
export const MIN_SIZE = 30;
export const MAX_SIZE = 1500;

// Limite de caracteres do nome de uma seção (container). Existe pra manter
// o rótulo legível e servir de base no cálculo do tamanho mínimo do
// container (CONTAINER_MIN_WIDTH abaixo) — sem um teto fixo no texto não
// dá pra garantir que o nome nunca vaze pra fora da borda.
export const CONTAINER_LABEL_MAX_LENGTH = 20;

// Limites de escala EXCLUSIVOS dos containers (divisores de seção). Maiores
// que os blocos normais porque um container precisa cobrir áreas grandes do
// canvas (que é 5000x5000 — ver PAN_LIMIT em useCanvasInteractions.js).
// Largura e altura mínimas agora são separadas (antes era um único
// CONTAINER_MIN_SIZE = 100, pequeno demais): a largura mínima precisa ser
// grande o bastante pra caber o nome inteiro da seção (até
// CONTAINER_LABEL_MAX_LENGTH caracteres) sem estourar a borda; a altura não
// tem essa restrição, então pode continuar menor.
export const CONTAINER_MIN_WIDTH  = 260;
export const CONTAINER_MIN_HEIGHT = 140;
export const CONTAINER_MAX_WIDTH  = 4000;
export const CONTAINER_MAX_HEIGHT = 4000;

// Distância (px do canvas) entre o canto superior-esquerdo do container e o
// texto do nome. Usada tanto na criação (useBlockFactories.js) quanto no
// reposicionamento durante drag/resize (repositionContainerLabel abaixo).
export const CONTAINER_LABEL_PAD = 10;

// Distância de tolerância (em px de TELA) considerada "borda" de um
// container pra fins de seleção — ver containerBorderOnly abaixo.
export const CONTAINER_BORDER_HIT_MARGIN = 8;

// Base da API de mapas
export const API_BASE = "http://localhost:8081/apiAvMap";

// Remove de fato o handle de rotação de um objeto do Fabric.
// lockRotation (já presente em SELECTION_STYLE) só trava a INTERAÇÃO — o
// ícone (control "mtr") continua sendo desenhado acima do objeto mesmo
// travado, dependendo da versão do Fabric. setControlsVisibility sozinho
// às vezes não basta, então aqui removemos o controle "mtr" diretamente do
// objeto (clonando o objeto `controls` antes, pra não mexer no objeto de
// controles compartilhado entre todas as instâncias da mesma classe).
// Chamar depois de criar (ou clonar/colar) qualquer objeto do canvas.
export function noRotate(obj) {
  if (!obj) return obj;
  obj.set({ lockRotation: true });
  obj.setControlsVisibility?.({ mtr: false });
  if (obj.controls) {
    obj.controls = { ...obj.controls };
    delete obj.controls.mtr;
  }
  return obj;
}

// Faz o retângulo de um container (addContainer) só ficar selecionável perto
// das 4 bordas — nunca no miolo. Sem isso, qualquer clique dentro da área do
// container (mesmo em espaço vazio, sem nenhum bloco por cima dele)
// selecionava o container inteiro, atrapalhando quando o usuário só queria
// clicar/arrastar algo DENTRO da seção.
//
// Antes disso dependia de perPixelTargetFind + fill transparent (o cache do
// objeto teria alpha 0 no miolo, então o clique "passaria direto"). Na
// prática isso depende de como o fabric rasteriza/interpreta a cor
// "transparent" no cache interno — aqui sobrescrevemos containsPoint direto
// na instância com uma verificação geométrica simples, sem depender disso.
//
// getAbsoluteCenter já resolve pan/zoom (e o caso de estar dentro de uma
// ActiveSelection), igual usado em Axis.jsx pro cálculo de bounds.
//
// PRECISA ser reaplicada sempre que um container for reconstruído a partir
// de dados serializados: clone() (useClipboard.js) e loadFromJSON()
// (usePersistence.js) recriam a instância via toObject/fromObject, o que
// não preserva overrides de método postos direto no objeto. Por isso é
// chamada nos 3 lugares onde um container "nasce": addContainer,
// pasteClipboard e carregarMapa.
export function containerBorderOnly(rect) {
  if (!rect) return rect;
  rect.perPixelTargetFind = false; // usamos o containsPoint próprio abaixo, não o cache de pixels
  rect.containsPoint = function (point) {
    const zoom   = this.canvas ? this.canvas.getZoom() : 1;
    const margin = CONTAINER_BORDER_HIT_MARGIN / zoom;

    const center = getAbsoluteCenter(this);
    const hw = this.getScaledWidth()  / 2;
    const hh = this.getScaledHeight() / 2;

    const dx = Math.abs(point.x - center.x);
    const dy = Math.abs(point.y - center.y);

    // Fora do retângulo (com a margem de folga) → nunca é um hit
    if (dx > hw + margin || dy > hh + margin) return false;

    // "Hit" só perto de uma das 4 arestas; o miolo (dx/dy bem menores que
    // hw/hh) sempre cai fora e deixa o clique passar pro que tiver embaixo
    return dx >= hw - margin || dy >= hh - margin;
  };
  return rect;
}

// Reposiciona o texto do nome de um container (_linkedLabel) grudado no
// canto superior-esquerdo do retângulo (_isBackground). Usa a posição
// ABSOLUTA do retângulo (calcTransformMatrix já resolve zoom/pan e também
// o caso de estar dentro de uma ActiveSelection sendo arrastada/
// redimensionada junto com outros objetos — mesma técnica de
// getAbsoluteEdge/getAbsoluteCenter em geometry.js). Chamado sempre que o
// retângulo se move ou é redimensionado (refreshBlock/refreshActiveSelection
// em usePortsAndConnections.js).
export function repositionContainerLabel(rect) {
  if (!rect || !rect._linkedLabel) return;
  const label = rect._linkedLabel;
  const center = getAbsoluteCenter(rect);
  const hw = rect.getScaledWidth() / 2;
  const hh = rect.getScaledHeight() / 2;
  label.set({
    left: center.x - hw + CONTAINER_LABEL_PAD,
    top:  center.y - hh + CONTAINER_LABEL_PAD,
  });
  label.setCoords();
}