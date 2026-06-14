import { useState, useEffect } from 'react'
import CerberusDisplay from './CerberusDisplay'
import styles from './modules/home.module.css'

function getUsername() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).username : null;
}

export default function UserBlock() {
  const [username, setUsername] = useState(() => getUsername());

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
        <p className={styles.sub}>Memento viviere!</p>
      </div>
    </div>
  )
}