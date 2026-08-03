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