import { useEffect, useState } from "react";
import StarBackground from "./Starbackground";
import WinTitleBar from "./Wintitlebar.jsx";
import styles from "./modules/NoteFullscreen.module.css";

const TEXT_LIMIT = 2500;

export default function NoteFullscreen({ note, onUpdate, onClose }) {
  const [title, setTitle] = useState(note.title ?? "");
  const [text, setText] = useState(note.note ?? "");


  useEffect(() => {
    setTitle(note.title ?? "");
    setText(note.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  const dirty = title !== (note.title ?? "") || text !== (note.note ?? "");
  const toLongText = text.length > TEXT_LIMIT;

  const handleSave = () => {
    if (!dirty || toLongText) return;
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
  }, [onClose, title, text, dirty, toLongText]);

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
            />
            {note.date && <p className={styles.date}>{note.date}</p>}

            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua nota aqui…"
              autoFocus
            />
            <p className={styles.charCount}>
              {text.length}/{TEXT_LIMIT}
              {toLongText && " — texto muito longo"}
            </p>
          </div>

          <div className={styles.footer}>
            <button className={styles.discardBtn} onClick={onClose}>
              Fechar
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!dirty || toLongText}
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}