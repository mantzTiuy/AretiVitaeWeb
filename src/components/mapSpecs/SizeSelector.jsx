import styles from './modules/mapSpecs.module.css';
/*Em memória */
const SIZES = ['1×', '2×', '3×', '4×'];

export default function SizeSelector({ value, onChange }) {
  return (
    <div className={styles.sizeRow}>
      {SIZES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`${styles.sizeBtn} ${value === s ? styles.sizeBtnActive : ''}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}