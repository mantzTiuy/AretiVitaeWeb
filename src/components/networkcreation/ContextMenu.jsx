import { createPortal } from "react-dom";
import styles from "./modules/ContextMenu.module.css";


export default function ContextMenu({ menu, menuRef, items = [], onClose }) {
  if (!menu.visible) return null;

  return createPortal(
    <ul
      ref={menuRef}
      className={styles.contextMenu}
      style={{ top: menu.y, left: menu.x }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className={styles.contextMenuItem}
          onClick={() => {
            item.onClick?.(menu.targetId);
            onClose();
          }}
        >
          {item.label}
        </li>
      ))}
    </ul>,
    document.body
  );
}