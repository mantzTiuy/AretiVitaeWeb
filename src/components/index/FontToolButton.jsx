import { useState } from "react";
import stylestoolbox from "./modules/toolbox.module.css";

// Reaproveita as mesmas classes CSS do ToolButton.jsx, mas mostra "Aa" no lugar
// de um ModelIcon — assim não é preciso cadastrar um novo ícone em models.js.
// Se você já tiver (ou quiser criar) um ícone próprio pra "Fontes", troque o
// conteúdo do <span className={stylestoolbox.iconStage}> por <ModelIcon .../>.
export default function FontToolButton({
  active = false,
  onClick,
  label = "Fontes",
  tooltipPosition = "top",
}) {
  const [hovered, setHovered] = useState(false);

  const tooltipClass = [
    stylestoolbox.tooltip,
    tooltipPosition === "top" ? stylestoolbox.tooltipTop : "",
    hovered ? stylestoolbox.tooltipVisible : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={`${stylestoolbox.toolBtn} ${active ? stylestoolbox.toolBtnActive : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title={label}
    >
      <span className={stylestoolbox.iconGlow} aria-hidden="true" />
      <span className={stylestoolbox.iconStage} style={{ fontWeight: 700, fontSize: 15 }}>
        Aa
      </span>
      <span className={tooltipClass}>{label}</span>
    </button>
  );
}