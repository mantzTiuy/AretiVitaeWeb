import styles from './modules/CreateCanvas.module.css';

export default function SectionTitle({ label }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionLine} />
      <p>{label}</p>
      <span className={styles.sectionLine} />
    </div>
  );
}