import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './modules/CreateCanvas.module.css';
import axios from 'axios';

export default function MapCarousel({ onSelect }) {
  const navigate = useNavigate();

  const [itens, setItens] = useState([]); //ITENS do objeto
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [navegando, setNavegando] = useState(false); //Controla o overlay de transição entre telas

  useEffect(() => {
    let cancel = false;

    async function load(){
      const userStr = localStorage.getItem("user");//Pega o user do localstorage

      if (!userStr) {
        if (!cancel) {//Verifica se cancel é false, evitando que ele de erro "direto"
          setErro("Usuário não encontrado. Faça login novamente.");
          setLoading(false);
        }
        return;
      }

      let username;
      try {
        username = JSON.parse(userStr).username;//Converte json em objeto e pega o username
      } catch {
        username = null; // Deixe o username null caso não tenha informações (usuário não cadastrou mapas ou erro no servidor)
      }

      if (!username) {
        if (!cancel) {
          setErro("Usuário não encontrado. Faça login novamente.");
          setLoading(false);
        }
        return;
      }

      try{
          const { data } = await axios.get(`http://localhost:8081/apiAvMap/username/${username}`);
          if (!cancel) setItens(data);
      }
      catch(er){
        console.log("Erro ao carregar itens:", er);
        if (!cancel) setErro("Você ainda não tem mapas.");
      }
      finally{
         if (!cancel) setLoading(false);//Se cancel for false ele garante que ao final o loading vai sumir de alguma forma
      }
    }

    load();//Executa a função (não pensei em um jeito melhor de fazer isso)

    return () => { cancel = true; };//Retorna o cancel e evita que haja multiplas requisições sendo disparadas, evitando o seguinte problema: O usuário pode clicar e sair pra outra tela de alguma forma, o que faz com que o react não processe mais a tela porém o rota ainda está aberta "executando a função", podendo gerar problemas como telas do react sendo renderizadas sem a presença do contéudo do backend(como o canvas vazio)

  },[]);

  function handleCardClick(m) {
    if (onSelect) {
      onSelect(m);
      return;
    }

    setNavegando(true); //Mostra o overlay imediatamente

    //Pequeno delay só pra dar tempo do fade aparecer antes da troca de tela
    //(sem isso, o navigate acontece instantaneamente e o overlay nem chega a ser percebido)
    setTimeout(() => {
      navigate(`/canvas/${m.id}`);
    }, 300);
  }

  return (
    <div className={styles.window}>
      {navegando && (
        <div className={styles.transitionOverlay}>
          <p className={styles.transitionText}>Abrindo mapa...</p>
        </div>
      )}

      <div className={styles.titlebar}>
        <span className={styles.titlebarLabel}>Últimos mapas</span>
        <div className={styles.dots}>
          <div className={`${styles.dot} ${styles.dotGray}`} />
          <div className={`${styles.dot} ${styles.dotYellow}`} />
          <div className={`${styles.dot} ${styles.dotRed}`} />
        </div>
      </div>

      <div className={styles.mapsBody}>
        {loading && <p className={styles.mapsStatus}>Carregando...</p>}

        {!loading && erro && (
          <p className={styles.mapsStatus}>{erro}</p>
        )}

        {!loading && !erro && itens.length === 0 && (
          <p className={styles.mapsStatus}>Nenhum mapa encontrado.</p>
        )}

        {!loading && !erro && itens.length > 0 && (
          <div className={styles.mapsGrid}>
            {itens.map((m) => (
              <div
                key={m.id}//Cada card tem um id, esse que é passado para o handle e leva ao canvas de respectivo id
                className={styles.card}
                onClick={() => handleCardClick(m)}
              >
                <div className={styles.cardTitlebar}>
                  <div className={styles.cardDot} />
                </div>

                <div className={styles.thumb} />

                <div className={styles.info}>
                  <p className={styles.name}>{m.title}</p>
                  {m.date && <p className={styles.date}>{m.date}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}