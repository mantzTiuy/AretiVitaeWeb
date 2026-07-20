// CardCTA.jsx
import styles from './modules/Card.module.css'

export default function CardCTA({ label, href }) {
  const filled = Boolean(href)

  const handleClick = () => {
    if (href) window.location.href = href
  }

  return (
    <button
      type="button"
      className={`${styles.ctaButton} ${filled ? styles.ctaButtonFilled : ''}`}
      onClick={handleClick}
    >
      <span className={styles.ctaDot} />
      {label}
    </button>
  )
}