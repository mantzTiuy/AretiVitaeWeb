import styles from './modules/MapCard.module.css';

export default function MapCard({ name, date, hue = 220, onClick }) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.thumb} style={{ '--hue': hue }}>
        <div className={styles.thumbGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.thumbBlock} />
          ))}
        </div>
        <div className={styles.thumbOverlay} />
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{name}</p>
        <p className={styles.date}>{date}</p>
      </div>
    </div>
  );
}