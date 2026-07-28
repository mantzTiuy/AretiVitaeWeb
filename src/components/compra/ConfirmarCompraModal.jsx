import PlanSymbol from "../networkdemo/PlanSymbol";
import styles from "./modules/ConfirmarCompraModal.module.css";

export default function ConfirmarCompraModal({
  aberto,
  planoNome,
  preco,
  modelPath,
  modelScale,
  carregando,
  onConfirmar,
  onCancelar,
}) {
  if (!aberto) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancelar}>
      <div className={styles.winWindow} onClick={(e) => e.stopPropagation()}>
        <div className={styles.winTitleBar}>
          <span className={styles.winTitle}>Confirmar</span>
          <div className={styles.winControls}>
            <span className={styles.winBtn} />
            <span className={styles.winBtn} />
            <button
              type="button"
              className={`${styles.winBtn} ${styles.winClose}`}
              onClick={onCancelar}
              aria-label="Fechar"
            />
          </div>
        </div>

        <div className={styles.winBody}>
          {modelPath && (
            <div className={styles.simboloWrap}>
              <PlanSymbol model={modelPath} scaleMultiplier={modelScale} />
            </div>
          )}

          <h2 className={styles.plano}>{planoNome}</h2>

          {preco && (
            <div className={styles.precoRow}>
              <span className={styles.precoValor}>{preco}</span>
              <span className={styles.precoSub}>por mês</span>
            </div>
          )}

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.cancelar}
              onClick={onCancelar}
              disabled={carregando}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.confirmar}
              onClick={onConfirmar}
              disabled={carregando}
            >
              {carregando ? "Gerando..." : "Gerar QRCODE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}