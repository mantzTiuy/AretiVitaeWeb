import { useState } from "react";
import NoteCard from "./Notescard";
import ContextMenu from "./ContextMenu";
import ConfirmModal from "./ConfirmModal";
import NoteFullscreen from "./NoteFullscreen.jsx";
import useContextMenu from "./useContextMenu.jsx";
import styles from "./modules/Notesgrid.module.css";

export default function NotesGrid({ notes, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [fullscreenId, setFullscreenId] = useState(null);
  const { menu, openMenu, closeMenu, menuRef } = useContextMenu();

  const menuItems = [
    { label: "Abrir em tela cheia", onClick: (id) => setFullscreenId(id) },
    { label: "Editar", onClick: (id) => setEditingId(id) },
    { label: "Excluir", onClick: (id) => setDeleteTarget(id) },
  ];

  const targetNote = notes.find((n) => n.id === deleteTarget);
  const fullscreenNote = notes.find((n) => n.id === fullscreenId);

  return (
    <div className={styles.gridWrap}>
      <div className={styles.grid}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={onUpdate}
            editing={editingId === note.id}
            onRequestEdit={() => setEditingId(note.id)}
            onStopEdit={() => setEditingId(null)}
            onRequestDelete={() => setDeleteTarget(note.id)}
            onContextMenu={(e) => openMenu(e, note.id)}
          />
        ))}
      </div>

      <ContextMenu menu={menu} menuRef={menuRef} items={menuItems} onClose={closeMenu} />

      {deleteTarget !== null && (
        <ConfirmModal
          title="Excluir nota"
          message={`Tem certeza que deseja excluir "${targetNote?.title ?? "esta nota"}"?`}
          confirmLabel="Sim"
          cancelLabel="Cancelar"
          onConfirm={() => {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {fullscreenNote && (
        <NoteFullscreen
          note={fullscreenNote}
          onUpdate={onUpdate}
          onClose={() => setFullscreenId(null)}
        />
      )}
    </div>
  );
}