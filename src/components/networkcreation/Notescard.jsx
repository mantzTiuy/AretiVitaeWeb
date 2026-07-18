import { useEffect, useState } from "react";
import styles from "./modules/Notescard.module.css";

export default function NoteCard({
  note,
  onUpdate,
  editing,
  onRequestEdit,
  onStopEdit,
  onRequestDelete,
  onContextMenu,
}) {
  const [draft, setDraft] = useState(note.note ?? "");
  const [draftTitle, setDraftTitle] = useState(note.title ?? "");

  // Sempre que entrar em modo de edição, garante que os rascunhos
  // reflitam o conteúdo atual da nota.
  useEffect(() => {
    if (editing) {
      setDraft(note.note ?? "");
      setDraftTitle(note.title ?? "");
    }
  }, [editing, note.note, note.title]);

  const previewLines = (note.note ?? "").split("\n");

  const handleChange = (e) => {
    setDraft(e.target.value);
  };

  const handleTitleChange = (e) => {
    setDraftTitle(e.target.value);
  };

  const handleSave = () => {
    onUpdate(note.id, { title: draftTitle, note: draft });
    onStopEdit();
  };

  const handleCancel = () => {
    setDraft(note.note ?? "");
    setDraftTitle(note.title ?? "");
    onStopEdit();
  };

  return (
    <div
      className={`${styles.card} ${editing ? styles.cardEditing : ""}`}
      onContextMenu={(e) => !editing && onContextMenu(e)}
    >

      <div className={styles.cardTitlebar}>
        <div className={styles.cardTitlebarLeft}>
          {editing ? (
            <input
              className={styles.titleInput}
              value={draftTitle}
              onChange={handleTitleChange}
              placeholder="Título da nota"
            />
          ) : (
            <p className={styles.cardTitle}>{note.title}</p>
          )}
          <p className={styles.cardDate}>{note.date}</p>
        </div>
        <div className={styles.headerActions}>
          {!editing && (
            <button className={styles.editDot} onClick={onRequestEdit} title="Editar" />
          )}
          <button className={styles.deleteDot} onClick={onRequestDelete} title="Excluir" />
        </div>
      </div>

      <div className={styles.cardBody}>
        {!editing && (
          <p
            className={styles.cardPreview}
            onDoubleClick={onRequestEdit}
          >
            {note.note
              ? previewLines.slice(0, 4).join("\n")
              : <span className={styles.emptyHint}>Nota vazia — clique duas vezes para editar</span>
            }
            {previewLines.length > 4 && (
              <span className={styles.moreHint}> …+{previewLines.length - 4} linhas</span>
            )}
          </p>
        )}

        {editing && (
          <div>
            <textarea
              className={styles.textarea}
              value={draft}
              onChange={handleChange}
              placeholder="Escreva sua nota aqui…"
              autoFocus
            />
            <div className={styles.editorBtns}>
              <button className={styles.cancelBtn} onClick={handleCancel}>Descartar</button>
              <button className={styles.saveBtn} onClick={handleSave}>Salvar alterações</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}