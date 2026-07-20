// cardsData.js
export const CARDS = [
  {
    tag: 'Expansão',
    title: 'MoonModules',
    description:
      'Os MoonModules são pacotes de expansão pagos através de uma assinatura para os usuários do AretiVitae no navegador — módulos que expandem ainda mais a imersão do usuário dentro da plataforma.',
    side: 'left',
    isList: false,
    contact: 'aretivitae@gmail.com',
    ctaLabel: 'Voltar',
    ctaHref: '/home',
  },
  {
    tag: 'Módulo I',
    title: 'Hécate',
    symbol: '/symbols/hecate.webp',
    price: 'R$8.90',
    items: [
      'Suporte para canvas 1.5x maior que o comum',
      'Limite aumentado para 4 mapas',
      '25 espaços para notas',
    ],
    side: 'right',
    isList: true,
    ctaLabel: 'Assinar Hécate',
  },
  {
    tag: 'Módulo II',
    title: 'Artemis',
    symbol: '/symbols/Artemis.webp',
    price: 'R$17,90',
    items: [
      'Suporte para canvas 2x maior que o comum',
      'Limite aumentado para 6 mapas',
      '40 espaços para notas',
    ],
    side: 'left',
    isList: true,
    ctaLabel: 'Assinar Artemis',
  },
  {
    tag: 'Módulo III',
    title: 'Selene',
    symbol: '/symbols/SeleneSymbol.webp',
    price: 'R$25,90',
    items: [
      'Suporte para canvas 2.8x maior que o comum',
      'Limite aumentado para 10 mapas',
      '50 espaços para notas',
      'Exportar em SVG',
    ],
    side: 'right',
    isList: true,
    ctaLabel: 'Assinar Selene',
  },
]

// Título tem tamanho próprio por card/breakpoint — usado como CSS custom
// property em Card.jsx (ver comentário lá) já que o CSS puro não tem como
// expressar "tamanho diferente por item da lista".
export const TITLE_SIZES = {
  MoonModules: { desktop: '58px', tablet: '44px', mobile: '38px' },
  Hécate: { desktop: '52px', tablet: '38px', mobile: '30px' },
  Artemis: { desktop: '52px', tablet: '38px', mobile: '30px' },
  Selene: { desktop: '52px', tablet: '38px', mobile: '30px' },
}