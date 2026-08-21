import { useState } from "react";
import stylestoolbox from "./modules/toolbox.module.css";

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