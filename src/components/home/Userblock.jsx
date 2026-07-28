import { useState, useEffect } from 'react'
import axios from 'axios'
import CerberusDisplay from './CerberusDisplay'
import styles from './modules/home.module.css'

const API_BASE = "http://localhost:8081";

const PLANOS_NOME = {
  0: "Básico",
  1: "Hécate",
  2: "Artemis",
  3: "Selene",
  4: "Builder",
};

function getUsuarioLogado() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export default function UserBlock() {
  const [username, setUsername] = useState(() => getUsuarioLogado()?.username ?? null);
  const [plano, setPlano] = useState(null);

  useEffect(() => {
    const usuario = getUsuarioLogado();
    if (!usuario?.id) return;

    axios.get(`${API_BASE}/apiAv/plano/${usuario.id}`)
      .then((res) => setPlano(res.data.assinatura))
      .catch((erro) => console.error("Erro ao buscar plano do usuário:", erro));
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "user") {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        setUsername(parsed?.username ?? null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const nomePlano = plano !== null ? PLANOS_NOME[plano] ?? "Desconhecido" : "...";

  return (
    <div className={styles.userBlock}>
      <div className={styles.avatarSlot}>
        <CerberusDisplay />
      </div>
      <div>
        <p className={styles.greeting}>Olá, {username || 'AretiVitae'}</p>
        <p className={styles.sub}>{nomePlano}</p>
      </div>
    </div>
  )
}