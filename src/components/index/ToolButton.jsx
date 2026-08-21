import { useState } from "react";
import ModelIcon from "./ModelIcon";
import styles from "./modules/toolbox.module.css";
import { getIconSize, getIconRotation } from "./toolboxConfig";

const LOCKED_STYLE = { opacity: 0.35, filter: "grayscale(0.7)" };

export default function ToolButton({
  path,
  modelKey,
  iconSize,
  iconRotation,
  label,
  onClick,
  active = false,
  locked = false,
  statusLabel = null,
  indicatorClass = null,
  title,
  tooltipPosition = "side",
}) {
  const [hovered, setHovered] = useState(false);
  const size     = iconSize ?? getIconSize(modelKey);
  const rotation = iconRotation ?? getIconRotation(modelKey);

  const tooltipClass = [
    styles.tooltip,
    tooltipPosition === "top" ? styles.tooltipTop : "",
    hovered ? styles.tooltipVisible : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title={title ?? label}
    >
      <span
        className={styles.iconGlow}
        style={locked ? LOCKED_STYLE : undefined}
        aria-hidden="true"
      />
      <span
        className={styles.iconStage}
        style={locked ? LOCKED_STYLE : undefined}
      >
        <ModelIcon path={path} size={size} active={active} rotation={rotation} />
      </span>

      {indicatorClass && <span className={indicatorClass} />}

    
      <span className={tooltipClass}>
        {statusLabel ?? label}
      </span>
    </button>
  );
}