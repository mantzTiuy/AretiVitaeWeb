// ScrollCards.jsx
import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Stars from './Stars'
import Card from './Card'
import { CARDS } from './cardsData'
import { getBreakpoint } from './utils'
import styles from './modules/ScrollCards.module.css'

export default function ScrollCards() {
  const scroll = useScroll()
  const cardRefs = useRef([])
  const rootRef = useRef(null)

  const cardRefSetters = CARDS.map((_, i) => (el) => (cardRefs.current[i] = el))


  useEffect(() => {
    const el = document.createElement('div')
    el.className = styles.overlay
    document.documentElement.style.scrollbarWidth = 'none'
    document.body.style.overflow = 'hidden'
    document.body.appendChild(el)

    const root = createRoot(el)
    rootRef.current = root
    root.render(
      <>
        {CARDS.map((card, i) => (
          <Card key={card.title} card={card} ref={cardRefSetters[i]} />
        ))}
      </>,
    )

    return () => {
      root.unmount()
      rootRef.current = null
      document.documentElement.style.scrollbarWidth = ''
      document.body.style.overflow = ''
      document.body.removeChild(el)
    }
  }, [cardRefSetters])
 
  useFrame(() => {
    const offset = scroll.offset
    const breakpoint = getBreakpoint()
    const n = CARDS.length

    cardRefs.current.forEach((el, i) => {
      if (!el) return

      const isLeft = CARDS[i].side === 'left'
      const start = i / n
      const end = i === n - 1 ? 1.01 : (i + 1) / n
      const visible = offset >= start && offset < end

      el.style.opacity = visible ? '1' : '0'
      el.style.pointerEvents = visible ? 'auto' : 'none'

      if (breakpoint === 'mobile') {
        el.style.transform = visible
          ? 'translateY(-50%) translateX(-50%)'
          : 'translateY(-42%) translateX(-50%)'
      } else {
        el.style.transform = visible
          ? 'translateY(-50%) translateX(0px)'
          : `translateY(-50%) translateX(${isLeft ? '-80px' : '80px'})`
      }
    })
  })

  return <Stars />
}