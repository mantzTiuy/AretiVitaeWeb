// Gerador de ids para os blocos, não é 100% seguro, mas não depende de nada,
// os blocos podem ter conflitos de id em alguns casos, mesmo que absolutamente improvavel.
export const generateId = () => Math.random().toString(36).slice(2, 10);

// APARENCIA DOS REDIMENCIONADORES, (não das portas)
export const SELECTION_STYLE = {
  cornerColor: "#5083ef",
  cornerStrokeColor: "#ffffff",
  cornerSize: 12,
  cornerStyle: "square",
  transparentCorners: false,
  borderColor: "#5083ef",
  borderDashArray: [4, 4],
  padding: 4,
};

// Informações básicas das portas
export const PORT_RADIUS_BASE = 7;
export const PORT_FILL = "#93c5fd";
export const PORT_STROKE = "#fff";

// Limites de escala dos blocos
export const MIN_SIZE = 50;
export const MAX_SIZE = 1500;

// Base da API de mapas
export const API_BASE = "http://localhost:8081/apiAvMap";