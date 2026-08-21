import { useMemo } from "react";
import styles from "./modules/fontSelector.module.css";
import { GOOGLE_FONTS as ALL_GOOGLE_FONTS } from "./googleFonts";

// `fontsByCategory` é opcional: se vier (ex: já filtrado pelo plano do
// usuário em useFontSelection), usa ele. Se não vier, cai pro catálogo
// inteiro — mantém esse componente reaproveitável em outros lugares.
function FontSelector({ value, onChange, fontsByCategory }) {
  const source = fontsByCategory ?? ALL_GOOGLE_FONTS;
  const categories = useMemo(() => Object.entries(source), [source]);

  // Se a fonte atual do objeto não estiver mais liberada pro plano (ex:
  // plano foi rebaixado depois de aplicar essa fonte), mostra ela mesmo
  // assim como opção extra — só pra não deixar o select em branco.
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