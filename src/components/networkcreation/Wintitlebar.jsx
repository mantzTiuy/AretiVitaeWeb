import styles from "./modules/WinTitleBar.module.css";

export default function WinTitleBar({ title, onClose }) {
  return (
    <div className={styles.titleBar}>
      <span className={styles.title}>{title}</span>
      <div className={styles.controls}>
        <span className={`${styles.btn} ${styles.dotGray}`} />
        <span className={`${styles.btn} ${styles.dotYellow}`} />
        <span className={`${styles.btn} ${styles.dotRed}`} onClick={onClose} title="Fechar" />
      </div>
    </div>
  );
}