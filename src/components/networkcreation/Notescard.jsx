import styles from "./modules/Notescard.module.css";

export default function NoteCard({
  note,
  onOpenFullscreen,
  onRequestDelete,
  onContextMenu,
}) {
  const previewLines = (note.note ?? "").split("\n");

  return (
    <div className={styles.card} onContextMenu={onContextMenu}>

      <div className={styles.cardTitlebar}>
        <div className={styles.cardTitlebarLeft}>
          <p className={styles.cardTitle}>{note.title}</p>
          <p className={styles.cardDate}>{note.date}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.editDot} onClick={onOpenFullscreen} title="Editar" />
          <button className={styles.deleteDot} onClick={onRequestDelete} title="Excluir" />
        </div>
      </div>

      <div className={styles.cardBody}>
        <p
          className={styles.cardPreview}
          onDoubleClick={onOpenFullscreen}
        >
          {note.note
            ? previewLines.slice(0, 4).join("\n")
            : <span className={styles.emptyHint}>Nota vazia — clique duas vezes para editar</span>
          }
          {previewLines.length > 4 && (
            <span className={styles.moreHint}> …+{previewLines.length - 4} linhas</span>
          )}
        </p>
      </div>

    </div>
  );
}