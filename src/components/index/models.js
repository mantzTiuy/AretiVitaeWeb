import { useGLTF } from "@react-three/drei";

// Mapeia cada ação da toolbox para o .glb correspondente em public/models.
export const MODEL_PATHS = {
  addBox:       "/models/addblock.glb",
  addText:      "/models/addtext.glb",
  addContainer: "/models/addsection.glb",
  center:       "/models/center.glb",
  media:        "/models/midia.glb",
  brush:        "/models/pincel.glb",
  eraser:       "/models/borracha.glb",
  undo:         "/models/desfazer.glb",
  redo:         "/models/refazer.glb",
  save:         "/models/save.glb",
  exportSvg:    "/models/svg.glb",
  settings:     "/models/config.glb",
};

// Precarrega tudo assim que o módulo é importado, pra não ter pop-in
// quando o usuário passar o mouse pela primeira vez em cada ícone.
Array.from(new Set(Object.values(MODEL_PATHS))).forEach((path) => {
  useGLTF.preload(path);
});