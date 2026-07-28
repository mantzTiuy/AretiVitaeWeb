
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
    model: '/models/hecate.glb',
    price: '8,90 BRL',
    items: [
      'Suporte para canvas 2x maior que o comum',
      'Limite aumentado para 10 mapas',
      '45 espaços para notas',
      'Personalização de textos através de fontes importadas',
    ],
    side: 'right',
    isList: true,
    ctaLabel: 'Assinar Hécate',
    ctaHref: '/compra/1',
  },
  {
    tag: 'Módulo II',
    title: 'Artemis',
    model: '/models/artemis.glb',
    modelScale: 0.7,
    price: '17,90 BRL',
    items: [
      'Suporte para canvas 4x maior que o comum',
      'Limite aumentado para 20 mapas',
      '90 espaços para notas',
      'Personalização de textos através de fontes importadas',
      'Cor de fundo personalizada do canvas',
    ],
    side: 'left',
    isList: true,
    ctaLabel: 'Assinar Artemis',
    ctaHref: '/compra/2',
  },
  {
    tag: 'Módulo III',
    title: 'Selene',
    model: '/models/selene.glb',
    modelScale: 0.75, 
    price: '25,90 BRL',
    items: [
      'Suporte para canvas 8x maior que o comum',
      'Limite aumentado para 40 mapas',
      '160 espaços para notas',
      'Personalização de textos através de fontes importadas',
      'Cor de fundo personalizada no canvas',
      'Exportar em SVG',
    ],
    side: 'right',
    isList: true,
    ctaLabel: 'Assinar Selene',
    ctaHref: '/compra/3',
  },
]

export const TITLE_SIZES = {
  MoonModules: { desktop: '58px', tablet: '44px', mobile: '38px' },
  Hécate: { desktop: '52px', tablet: '38px', mobile: '30px' },
  Artemis: { desktop: '52px', tablet: '38px', mobile: '30px' },
  Selene: { desktop: '52px', tablet: '38px', mobile: '30px' },
}