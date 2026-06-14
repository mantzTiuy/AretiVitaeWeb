import styles from './modules/CreateCanvas.module.css';

const OPTIONS = ['1×', '1.5×', '2×'];

export default function SizeSelector({ value, onChange }) {
  return (
    <div className={styles.sizeButtons}>
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`${styles.sizeBtn} ${value === opt ? styles.sizeBtnActive : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}