

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
      'Acesso a mais 10 fontes',
      'Personalização do fundo do canvas',
      'Ferramenta de desenho',
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
      'Importar mídia',
     'Acesso a mais 30 fontes',
      'Personalização do fundo do canvas',
      'Ferramenta de desenho',
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
    'Exportar em SVG',
    'Importar mídia',
    'Acesso a 125 fontes',
    'Personalização do fundo do canvas',
    'Ferramenta de desenho',
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