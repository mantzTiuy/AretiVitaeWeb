import styles from './modules/mapSpecs.module.css';

export default function SectionTitle({ label }) {
  return <div className={styles.sectionTitle}>{label}</div>;
}