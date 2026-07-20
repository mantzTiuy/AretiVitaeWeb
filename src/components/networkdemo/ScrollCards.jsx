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

  // Funções de ref estáveis (uma por card). Sem useMemo aqui de propósito
  // — o projeto usa o React Compiler, que memoiza isso automaticamente;
  // useMemo manual só atrapalha (ele não consegue mesclar com a própria
  // memoização e desiste de otimizar o componente inteiro).
  const cardRefSetters = CARDS.map((_, i) => (el) => (cardRefs.current[i] = el))

  // Cria um container real no <body> e uma raiz React própria pra ele.
  // Necessário porque este componente vive dentro da árvore do R3F (usa
  // useFrame/useScroll) — o reconciler do Three tentaria interpretar
  // <div>/<button> como objetos THREE se a gente usasse createPortal do
  // 'react-dom' aqui dentro. Uma raiz separada (createRoot) escapa
  // completamente do reconciler do Canvas — mesmo truque que o <Html> do
  // @react-three/drei usa por baixo dos panos.
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

  // Animação ligada ao scroll: roda a cada frame, por isso mexe direto no
  // style do DOM em vez de disparar re-render do React 60x/s.
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