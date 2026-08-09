import styles from "./modules/ConfirmModal.module.css";

export default function ConfirmModal({
  title = "Confirmação",
  message,
  confirmLabel = "OK",
  onConfirm,
  onClose,
  danger = false,
}) {
  const handleClose = () => {
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const handleKey = (e) => {
    if (e.key === "Enter")  handleConfirm();
    if (e.key === "Escape") handleClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
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
            <div className={`${styles.dot} ${styles.dotRed}`} onClick={handleClose} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>

          <div className={styles.btnRow}>
            <button
              className={`${styles.confirmBtn} ${danger ? styles.confirmBtnDanger : ""}`}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}