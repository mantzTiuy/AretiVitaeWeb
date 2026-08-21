import StarBackground from "../networkcreation/Starbackground.jsx";
import styles from "./modules/AcessoMobile.module.css";

export default function AcessoMobile() {
  return (
    <div className={styles.page}>
      <StarBackground />

      <div className={styles.outerWrap}>
        <div className={styles.winWindow}>

          <div className={styles.winHeader}>
            <div className={styles.dots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <span className={styles.winTitle}>Acesso Restrito</span>
          </div>

          <div className={styles.card}>
            <div className={styles.divider}>
              <span>ATENÇÃO</span>
            </div>

            <h1 className={styles.title}>AretiVitae Mobile</h1>
            <p className={styles.text}>
              A versão mobile dessa aplicação está disponível na play e apple store, a plataforma web não suporta telas pequenas e verticais
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}