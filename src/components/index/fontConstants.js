import { GOOGLE_FONTS } from "./googleFonts";
import { PLAN_FONTS } from "./planFonts";

export { GOOGLE_FONTS };

export const DEFAULT_FONT = "Josefin Sans";

// Catálogo inteiro, achatado (todas as categorias juntas).
export const AVAILABLE_FONTS = Object.values(GOOGLE_FONTS).flat();

// Plano básico (0) sempre libera só a fonte padrão, fixo.
const BASIC_PLAN_FONTS = [DEFAULT_FONT];

// Retorna a lista de fontes que o plano em questão libera.
// Planos 1 e 2 vêm de PLAN_FONTS (planFonts.js, editável ali).
// Plano 3+ (Selene) libera o catálogo inteiro.
export function getPlanFonts(plano) {
  if (plano >= 3) return AVAILABLE_FONTS;
  if (plano <= 0) return BASIC_PLAN_FONTS;

  const list = PLAN_FONTS[plano];
  if (!list || !list.length) return BASIC_PLAN_FONTS;

  // Só deixa passar fontes que realmente existem no catálogo — evita
  // que um nome digitado errado em planFonts.js quebre o seletor.
  const valid = list.filter((f) => AVAILABLE_FONTS.includes(f));
  return valid.length ? valid : BASIC_PLAN_FONTS;
}