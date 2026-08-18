import { useState, useEffect } from 'react'
import axios from 'axios'
import CerberusDisplay from './CerberusDisplay'
import styles from './modules/home.module.css'

const API_BASE = "http://localhost:8081";

function getUsuarioLogado() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export default function UserBlock() {
  const [username, setUsername] = useState(() => getUsuarioLogado()?.username ?? null);
  const [plano, setPlano] = useState(null);
  const [nomePlano, setNomePlano] = useState(null);

  useEffect(() => {
    const usuario = getUsuarioLogado();
    if (!usuario?.id) return;

    axios.get(`${API_BASE}/ApiAvCompra/status/${usuario.id}`)
      .then((res) => {
        if (res.data.temAcesso) {
          setPlano(res.data.plano);
          setNomePlano(res.data.nomePlano);
        } else {
          setPlano(0);
          setNomePlano("Básico");
        }
      })
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

  return (
    <div className={styles.userBlock}>
      <div className={styles.avatarSlot}>
        <CerberusDisplay />
      </div>
      <div>
        <p className={styles.greeting}>Olá, {username || 'AretiVitae'}</p>
        <p className={styles.sub}>{nomePlano ?? "..."}</p>
      </div>
    </div>
  )
}