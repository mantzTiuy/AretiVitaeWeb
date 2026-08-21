import { useMemo } from "react";
import styles from "./modules/fontSelector.module.css";
import { GOOGLE_FONTS as ALL_GOOGLE_FONTS } from "./googleFonts";


function FontSelector({ value, onChange, fontsByCategory }) {
  const source = fontsByCategory ?? ALL_GOOGLE_FONTS;
  const categories = useMemo(() => Object.entries(source), [source]);

  const hasValue = useMemo(
    () => categories.some(([, fontes]) => fontes.includes(value)),
    [categories, value]
  );

  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {!hasValue && value && <option value={value}>{value}</option>}
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