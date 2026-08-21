import styles from "./modules/fontSelection.module.css";

export default function FontSelectionPanel({
  open,
  onClose,
  fontsByCategory,
  selectedFonts,
  activeFont,
  onToggleFont,
  onSetActiveFont,
  fontLimit,
}) {
  if (!open) return null;

  const totalFonts = Object.values(fontsByCategory).reduce(
    (sum, list) => sum + list.length,
    0
  );
  const isUnlimited = !isFinite(fontLimit);
  const atLimit = !isUnlimited && selectedFonts.length >= fontLimit;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Fontes</h2>
            <p className={styles.subtitle}>
              {isUnlimited
                ? `Seu plano libera todas as fontes (${totalFonts})`
                : `${selectedFonts.length} de ${fontLimit} selecionadas`}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        {selectedFonts.length > 1 && (
          <div className={styles.activeRow}>
            <label htmlFor="active-font-select" className={styles.activeLabel}>
              Fonte para novos textos
            </label>
            <select
              id="active-font-select"
              className={styles.activeSelect}
              value={activeFont}
              onChange={(e) => onSetActiveFont(e.target.value)}
              style={{ fontFamily: activeFont }}
            >
              {selectedFonts.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        )}

        {Object.entries(fontsByCategory).map(([category, fonts]) => (
          <div key={category} className={styles.category}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.grid}>
              {fonts.map((font) => {
                const selected = selectedFonts.includes(font);
                const disabled = !selected && atLimit;
                const isOnlySelected = selected && selectedFonts.length === 1;

                const chipClass = [
                  styles.fontChip,
                  selected ? styles.fontChipSelected : "",
                  disabled ? styles.fontChipDisabled : "",
                  isOnlySelected ? styles.fontChipLocked : "",
                ].filter(Boolean).join(" ");

                return (
                  <button
                    type="button"
                    key={font}
                    className={chipClass}
                    style={{
                      fontFamily: font,
                      opacity: disabled ? 0.35 : 1,
                      filter: disabled ? "grayscale(0.7)" : "none",
                    }}
                    onClick={() => onToggleFont(font)}
                    title={isOnlySelected ? "Precisa ter ao menos 1 fonte selecionada" : font}
                  >
                    {selected && <span className={styles.check}>✓</span>}
                    {font}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}