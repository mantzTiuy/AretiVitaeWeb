// Card.jsx
import { forwardRef } from 'react'
import CardCTA from './CardCTA'
import { TITLE_SIZES } from './cardsData'
import styles from './modules/Card.module.css'

const Card = forwardRef(function Card({ card }, ref) {
  const isLeft = card.side === 'left'
  const titleSize = TITLE_SIZES[card.title]

  // Único uso de "inline style" que sobra: o tamanho do título varia por
  // card E por breakpoint (não dá pra expressar isso com uma classe fixa).
  // Em vez de escrever font-size direto, exportamos como CSS custom
  // properties e quem decide o valor final por breakpoint é o CSS
  // (ver .title / media queries no .module.css).
  const titleVars = {
    '--title-desktop': titleSize.desktop,
    '--title-tablet': titleSize.tablet,
    '--title-mobile': titleSize.mobile,
  }

  return (
    <div
      ref={ref}
      className={`${styles.card} ${isLeft ? styles.cardLeft : styles.cardRight}`}
    >
      <div className={styles.shimmer} />
      <div className={styles.accentBar} />

      <div className={styles.inner}>
        <div className={styles.tag}>{card.tag}</div>

        <div className={styles.titleRow}>
          {card.symbol && (
            <img className={styles.symbol} src={card.symbol} alt={card.title} />
          )}
          <div className={styles.title} style={titleVars}>
            {card.title}
          </div>
        </div>

        <div className={styles.divider} />

        {card.isList ? (
          <ul className={styles.list}>
            {card.items.map((text) => (
              <li key={text} className={styles.listItem}>
                <span className={styles.listDot} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.description}>{card.description}</p>
        )}

        {card.price && (
          <div className={styles.priceRow}>
            <span className={styles.priceValue}>{card.price}</span>
            <span className={styles.priceSub}>por mês</span>
          </div>
        )}

        {card.contact && (
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Contato:</span>
            <a className={styles.contactValue} href={`mailto:${card.contact}`}>
              {card.contact}
            </a>
          </div>
        )}

        {card.ctaLabel && <CardCTA label={card.ctaLabel} href={card.ctaHref} />}
      </div>
    </div>
  )
})

export default Card