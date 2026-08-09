import styles from "./modules/ConfirmModal.module.css";

export default function ConfirmModal({
  title = "Confirmação",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  onClose,
  danger = false,
}) {
  const handleCancel = () => {
    if (onCancel) onCancel();
    else onClose?.();
  };

  const handleKey = (e) => {
    if (e.key === "Enter")  onConfirm?.();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
        tabIndex={-1}
      >
        {/* ── Titlebar ── */}
        <div className={styles.titlebar}>
          <span className={styles.titlebarLabel}>{title}</span>
          <div className={styles.dots}>
            <div className={`${styles.dot} ${styles.dotGray}`} />
            <div className={`${styles.dot} ${styles.dotYellow}`} />
            <div className={`${styles.dot} ${styles.dotRed}`} onClick={handleCancel} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>

          <div className={styles.btnRow}>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              {cancelLabel}
            </button>
            <button
              className={`${styles.confirmBtn} ${danger ? styles.confirmBtnDanger : ""}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}