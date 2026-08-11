import { useMemo } from "react";
import styles from "./modules/fontSelector.module.css";
import { GOOGLE_FONTS } from "./googleFonts";

function FontSelector({ value, onChange }) {
  const categories = useMemo(() => Object.entries(GOOGLE_FONTS), []);

  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {categories.map(([categoria, fontes]) => (
        <optgroup key={categoria} label={categoria}>
          {fontes.map((fonte) => (
            <option key={fonte} value={fonte}>
              {fonte}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default FontSelector;