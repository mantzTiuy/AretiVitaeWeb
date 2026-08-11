import stylestoolbox from "./modules/toolbox.module.css";

const PANEL_STYLE = {
  position:      "absolute",
  top:           "calc(100% + 6px)",
  left:          0,
  background:    "#ffffff",
  border:        "1px solid #e2e4ea",
  borderRadius:  "8px",
  padding:       "12px",
  boxShadow:     "0 4px 12px rgba(0,0,0,0.18)",
  display:       "flex",
  flexDirection: "column",
  gap:           "10px",
  zIndex:        20,
  minWidth:      "190px",
};

const ROW_STYLE = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "10px",
  fontSize:       "13px",
};


export default function CanvasSettingsPanel({
  open,
  onClose,
  bgColor,
  lineColor,
  onBgColorChange,
  onLineColorChange,
  onReset,
}) {
  if (!open) return null;

  return (
    <div style={PANEL_STYLE}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Canvas</strong>
        <button onClick={onClose} className={stylestoolbox.button} style={{ padding: "2px 8px" }}>
          X
        </button>
      </div>

      <label style={ROW_STYLE}>
        Cor de fundo
        <input
          type="color"
          value={bgColor}
          onChange={(e) => onBgColorChange(e.target.value)}
        />
      </label>

      <label style={ROW_STYLE}>
        Cor da grade
        <input
          type="color"
          value={lineColor}
          onChange={(e) => onLineColorChange(e.target.value)}
        />
      </label>

      <button onClick={onReset} className={stylestoolbox.button}>
        Restaurar padrão
      </button>
    </div>
  );
}