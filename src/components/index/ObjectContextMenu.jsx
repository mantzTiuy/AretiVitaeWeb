import React, { forwardRef } from "react";
import styles from "./modules/Objectcontext.module.css";

const MENU_WIDTH = 168;
const MENU_HEIGHT = 76;
const EDGE_MARGIN = 8;

const ITEMS = [
  { action: "front", label: "Enviar para frente" },
  { action: "back", label: "Enviar para trás" },
];

function MenuItem({ action, label, onAction }) {
  return (
    <li className={styles.menuItem} onClick={() => onAction(action)}>
      {label}
    </li>
  );
}

const ObjectContextMenu = forwardRef(function ObjectContextMenu({ x, y, onAction }, ref) {
  const left = Math.min(Math.max(x, EDGE_MARGIN), window.innerWidth - MENU_WIDTH - EDGE_MARGIN);
  const top = Math.min(Math.max(y, EDGE_MARGIN), window.innerHeight - MENU_HEIGHT - EDGE_MARGIN);

  return (
    <ul
      ref={ref}
      className={styles.contextMenu}
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {ITEMS.map((item) => (
        <MenuItem key={item.action} action={item.action} label={item.label} onAction={onAction} />
      ))}
    </ul>
  );
});

export default ObjectContextMenu;