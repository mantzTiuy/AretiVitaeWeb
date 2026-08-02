import { useEffect, useState } from "react";
import StarBackground from "./Starbackground";
import WinTitleBar from "./Wintitlebar.jsx";
import styles from "./modules/NoteFullscreen.module.css";

export default function NoteFullscreen({ note, onUpdate, onClose }) {
  const [title, setTitle] = useState(note.title ?? "");
  const [text, setText] = useState(note.note ?? "");

  // Se a nota selecionada mudar (ex: abrir outra direto), sincroniza os rascunhos
  useEffect(() => {
    setTitle(note.title ?? "");
    setText(note.note ?? "");
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = title !== (note.title ?? "") || text !== (note.note ?? "");

  const handleSave = () => {
    if (!dirty) return;
    onUpdate(note.id, { title, note: text });
    onClose();
  };


  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, title, text, dirty]); 

  return (
    <div className={styles.page}>
      <StarBackground />

      <div className={styles.outerWrap}>
        <div className={styles.winWindow}>
          <WinTitleBar title="Nota" onClose={onClose} />

          <div className={styles.body}>
            <input
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota"
              autoFocus
            />
            {note.date && <p className={styles.date}>{note.date}</p>}

            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua nota aqui…"
            />
          </div>

          <div className={styles.footer}>
            <button className={styles.discardBtn} onClick={onClose}>
              Fechar
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!dirty}
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}