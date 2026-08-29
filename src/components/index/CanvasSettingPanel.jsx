import styles from "./modules/canvasSettingsPanel.module.css"

export default function CanvasSettingsPanel({
  open,
  onClose,
  bgColor,
  lineColor,
  toolboxBgColor,
  onBgColorChange,
  onLineColorChange,
  onToolboxBgColorChange,
  onReset,
}) {
  if (!open) return null;

  const handleKey = (e) => {
    if (e.key === "Enter")  onClose?.();
    if (e.key === "Escape") onClose?.();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
        tabIndex={-1}
      >
        {/* ── Titlebar ── */}
        <div className={styles.titlebar}>
          <span className={styles.titlebarLabel}>Configurações do canvas</span>
          <div className={styles.dots}>
            <div className={`${styles.dot} ${styles.dotGray}`} />
            <div className={`${styles.dot} ${styles.dotYellow}`} />
            <div className={`${styles.dot} ${styles.dotRed}`} onClick={onClose} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          <div className={styles.row}>
            <span className={styles.label}>Cor de fundo</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => onBgColorChange(e.target.value)}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Cor das linhas</span>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => onLineColorChange(e.target.value)}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Cor da toolbox</span>
            <input
              type="color"
              value={toolboxBgColor}
              onChange={(e) => onToolboxBgColorChange(e.target.value)}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.btnRow}>
            <button className={styles.resetBtn} onClick={onReset}>
              Restaurar padrão
            </button>
            <button className={styles.confirmBtn} onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}