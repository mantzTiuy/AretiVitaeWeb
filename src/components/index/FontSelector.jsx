import { useMemo } from "react";
import styles from "./modules/fontSelector.module.css";
import { GOOGLE_FONTS } from "./googleFonts";

// Componente exclusivo pra troca de fonte de blocos de texto (Textbox).
// Só cuida do dropdown — quem usa decide o que fazer com a fonte
// escolhida (carregar via loadGoogleFont, aplicar no objeto do fabric,
// etc). Não faz preview de cada fonte na própria lista porque isso exigiria
// carregar todas de uma vez, o que vai contra a ideia de carregar só sob
// demanda.
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