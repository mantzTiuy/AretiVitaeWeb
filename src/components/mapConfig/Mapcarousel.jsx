import { useRef } from 'react';
import styles from './modules/CreateCanvas.module.css';
import MapCard from './Mapcard';

const MAPS = [
  { id: 1, name: 'Mapa Estelar',  date: '12 jun 2026', hue: 225 },
  { id: 2, name: 'Projeto Lyra',  date: '10 jun 2026', hue: 210 },
  { id: 3, name: 'Cosmos Draft',  date: '08 jun 2026', hue: 235 },
  { id: 4, name: 'Nebula UI',     date: '05 jun 2026', hue: 215 },
  { id: 5, name: 'Aurora Map',    date: '01 jun 2026', hue: 200 },
  { id: 6, name: 'Selene Board',  date: '28 mai 2026', hue: 240 },
  { id: 7, name: 'Void Canvas',   date: '20 mai 2026', hue: 220 },
];

export default function MapCarousel({ onSelect }) {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className={styles.carouselSection}>
      <div className={styles.carouselHeader}>
        <span className={styles.sectionLine} />
        <p>Últimos mapas</p>
        <span className={styles.sectionLine} />
      </div>

      <div className={styles.carouselWrap}>
        <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={() => scroll(-1)} type="button">‹</button>

        <div className={styles.carousel} ref={ref}>
          {MAPS.map((m) => (
            <MapCard
              key={m.id}
              name={m.name}
              date={m.date}
              hue={m.hue}
              onClick={() => onSelect?.(m)}
            />
          ))}
        </div>

        <button className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={() => scroll(1)} type="button">›</button>
      </div>
    </div>
  );
}