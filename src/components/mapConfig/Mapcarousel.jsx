import styles from './modules/CreateCanvas.module.css';

const MAPS = [
  { id: 1, name: 'MúsicaRitmo',  date: '11 jun 2024' },
  { id: 2, name: 'Hunger games no roblox',  date: '20 jan 2026' },
  { id: 3, name: 'Jogo tipo unbound',  date: '08 jun 2026' },
  { id: 4, name: 'Biblioteca para java',     date: '05 set 2026' },
  { id: 5, name: 'AretiVitae',    date: '01 ago 2026' },
  { id: 6, name: 'julo',  date: '28  out 2021' },
  { id: 7, name: 'GalinheiroProjeto',   date: '20 mai 2026' },
  { id: 8, name: 'Hortinha',     date: '15 mai 2026' },
];

export default function MapCarousel({ onSelect }) {
  return (
    <div className={styles.window}>
      <div className={styles.titlebar}>
        <span className={styles.titlebarLabel}>Últimos mapas</span>
        <div className={styles.dots}>
          <div className={`${styles.dot} ${styles.dotGray}`} />
          <div className={`${styles.dot} ${styles.dotYellow}`} />
          <div className={`${styles.dot} ${styles.dotRed}`} />
        </div>
      </div>

      <div className={styles.mapsBody}>
        <div className={styles.mapsGrid}>
          {MAPS.map((m) => (
            <div
              key={m.id}
              className={styles.mapCard}
              onClick={() => onSelect?.(m)}
            >
              <div className={styles.mapThumb}>
                <i className="ti ti-loader" aria-hidden="true" />
              </div>
              <div className={styles.mapInfo}>
                <p className={styles.mapName}>{m.name}</p>
                <p className={styles.mapDate}>{m.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}