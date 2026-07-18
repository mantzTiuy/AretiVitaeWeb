import styles from "./modules/NewNoteModal.module.css";

export default function NewNoteModal({
  titulo,
  onTituloChange,
  toLogTitle,
  camposVazios,
  onConfirm,
  onClose,
}) {
  const handleKey = (e) => {
    if (e.key === "Enter")  onConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* ── Titlebar ── */}
        <div className={styles.titlebar}>
          <span className={styles.titlebarLabel}>Nova nota</span>
          <div className={styles.dots}>
            <div className={`${styles.dot} ${styles.dotGray}`} />
            <div className={`${styles.dot} ${styles.dotYellow}`} />
            <div className={`${styles.dot} ${styles.dotRed}`} onClick={onClose} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionLine} />
            <p className={styles.sectionText}>Identificação</p>
            <span className={styles.sectionLine} />
          </div>

          <p className={styles.sub}>Escolha um título para a sua nota</p>

          <input
            className={styles.input}
            type="text"
            placeholder="Título da nota…"
            value={titulo}
            onChange={(e) => onTituloChange(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
          {toLogTitle && (
            <p className={styles.errorMsg}>Título muito longo.</p>
          )}

          <div className={styles.btnRow}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button
              className={styles.confirmBtn}
              onClick={onConfirm}
              disabled={camposVazios}
            >
              Criar nota
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}