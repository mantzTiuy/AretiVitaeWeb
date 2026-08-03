// FixedCta.jsx
import { forwardRef } from 'react'
import CardCTA from './CardCTA'
import styles from './modules/ScrollCards.module.css'

const FixedCta = forwardRef(function FixedCta({ card }, ref) {
  if (!card?.ctaLabel) return <div ref={ref} className={styles.ctaWrapper} />

  return (
    <div ref={ref} className={styles.ctaWrapper}>
      <CardCTA label={card.ctaLabel} href={card.ctaHref} />
    </div>
  )
})

export default FixedCta