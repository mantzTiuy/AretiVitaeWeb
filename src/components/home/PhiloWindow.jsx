import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './modules/Window.module.css';

export default function PhiloWindow() {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    async function loadLastNote() {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        if (!cancel) setLoading(false);
        return;
      }

      let userId;
      try {
        userId = JSON.parse(userStr).id;
      } catch {
        userId = null;
      }

      if (!userId) {
        if (!cancel) setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`http://localhost:8081/apiAvNotes/User/${userId}`);

        if (!cancel && Array.isArray(data) && data.length > 0) {
          const ultima = [...data].sort((a, b) => b.id - a.id)[0];
          setNote(ultima);
        }
      } catch (er) {
        console.log('Erro ao carregar última nota:', er);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    loadLastNote();

    return () => { cancel = true; };
  }, []);

  return (
    <div className={`${styles.winWindow} ${styles.philoWindow}`}>
      <div className={styles.winTitleBar}>
        <span className={styles.winTitle}>Notes</span>
        <div className={styles.winControls}>
          <span className={styles.winBtn} />
          <span className={styles.winBtn} />
          <span className={`${styles.winBtn} ${styles.winClose}`} />
        </div>
      </div>
      <div className={`${styles.winBody} ${styles.philoBody}`}>
        {!loading && (
          <div className={styles.quoteDisplay}>
            {note && (
              <p className={styles.quoteAuthor}>{note.title}</p>
            )}
            <p className={styles.quoteText}>
              {note ? note.note : 'Nenhuma nota criada ainda.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}