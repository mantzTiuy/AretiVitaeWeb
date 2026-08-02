import { useNavigate } from 'react-router-dom'
import styles from './modules/About.module.css'
import CanvasStarBackground from '../mapSpecs/CanvasStarBackground'


function SectionLabel({ children }) {
  return <p className={styles.sectionLabel}>{children}</p>
}

export default function About() {

  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <CanvasStarBackground />

      <div className={styles.bodyWrapper}>
        <div className={styles.window}>

          <div className={styles.titlebar}>
            <span className={styles.titlebarLabel}>Sobre o AretiVitae</span>
            <div className={styles.dots}>
              <div className={`${styles.dot} ${styles.dotGray}`} />
              <div className={`${styles.dot} ${styles.dotYellow}`} />
              <div className={`${styles.dot} ${styles.dotRed}`} />
            </div>
          </div>

          <div className={styles.formBody}>

            <div className={styles.brandBlock}>
              <h1 className={styles.brandTitle}>AretiVitae</h1>
              <p className={styles.brandSub}>ILUSTRADOR DE IDEIAS</p>
              <a href="mailto:aretivitae@gmail.com" className={styles.contactLink}>
                aretivitae@gmail.com
              </a>
            </div>

            <SectionLabel>O que é</SectionLabel>

            <p className={styles.paragraph}>
              O <strong>Areti Vitae: Ilustrador de ideias</strong> é uma plataforma digital
              e inovadora que visa auxiliar individuos  na conceitualização e no
              desenvolvimento de projetos e ideias por meio de um mapeamento visual intuitivo, com
              foco no desenvolvimento eficiente. Ele se destaca pelo canvas imersivo integrado a um sistema de notas, buscando
              evoluir ideias promissoras, especialmente aquelas de menor escala, e
              incentivando o desenvolvimento criativo.
            </p>

            <p className={styles.paragraph}>
              O projeto tem como premissa fundamental promover a criação e o desenvolvimento de
              ideias de maneira eficiente, empregando métodos intuitivos e ferramentas de suporte,
              além de possibilitar a contribuição dos usuários com suas respectivas ideias.
            </p>

            <p className={styles.paragraph}>
              O <em>Areti Vitae</em> é acessível a indivíduo com ideias
              criativas e inovadoras, sendo restrita ao uso de pessoas acima de 13 anos, e tem
              funcionalidades aos assinantes da versão <strong>"Moon-Modules"</strong>, com mais recursos
              para desenvolvimento e planejamento em maior escala.
            </p>

            <SectionLabel>Aplicativo mobile</SectionLabel>

            <p className={styles.paragraph}>
              Além da versão web, o <strong>AretiVitae</strong> conta com um aplicativo mobile
              complementar, pensado para acompanhar o desenvolvimento das ideias no dia a dia. Ele
              é focado no recurso de notas, permitindo registrar pensamentos rapidamente,
              onde quer que a inspiração apareça, para depois organizá-los no canvas principal.
            </p>

            <SectionLabel>Propósito</SectionLabel>

            <p className={styles.paragraph}>
              <em>Areti Vitae</em> busca auxiliar os usuários mais criativos e trazer uma nova
              perspectiva para quem nunca se imergiu dentro das próprias ideias. O projeto busca
              resolver um grande problema, sendo ele o possível déficit de organização e coerência
              em uma linha de pensamento complexa ligada a alguma ideia.
            </p>

            <p className={styles.paragraph}>
              Grandes projetos começam com uma simples conversa entre amigos, e{' '}
              <strong>AretiVitae</strong> ajuda com que essa ideia saia do papel e comece a ser
              conceitualizada de forma mais concreta.
            </p>

            <SectionLabel>Criadores</SectionLabel>

            <div className={styles.creatorsRow}>
              <span className={styles.creatorName}>João Mantz de Oliveira</span>
              <span className={styles.creatorSeparator} aria-hidden="true">·</span>
              <span className={styles.creatorName}>Maurício Fernandes Ferreira</span>
            </div>
            <p className={styles.creatorsNote}>
              Projeto desenvolvido por alunos da Unicamp (Universidade Estadual de Campinas)
            </p>

            <div className={styles.btnRow}>
              <button className={styles.discard} onClick={() => navigate('/home')}>
                Voltar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}