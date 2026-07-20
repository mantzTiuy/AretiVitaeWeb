// FixedCta.jsx
import { forwardRef } from 'react'
import CardCTA from './CardCTA'
import styles from './modules/ScrollCards.module.css'

// Wrapper fixo no rodapé da tela. Fica escondido/visível via classe
// (.ctaWrapperVisible), controlada a cada frame em ScrollCards.jsx —
// mesmo motivo dos cards: é animação ligada ao scroll, então mexe direto
// no DOM em vez de disparar re-render do React.
const FixedCta = forwardRef(function FixedCta({ card }, ref) {
  if (!card?.ctaLabel) return <div ref={ref} className={styles.ctaWrapper} />

  return (
    <div ref={ref} className={styles.ctaWrapper}>
      <CardCTA label={card.ctaLabel} href={card.ctaHref} />
    </div>
  )
})

export default FixedCta