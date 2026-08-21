import { GOOGLE_FONTS } from "./googleFonts";
import { PLAN_FONTS } from "./planFonts";

export { GOOGLE_FONTS };

export const DEFAULT_FONT = "Josefin Sans";


export const AVAILABLE_FONTS = Object.values(GOOGLE_FONTS).flat();


const BASIC_PLAN_FONTS = [DEFAULT_FONT];


export function getPlanFonts(plano) {
  if (plano >= 3) return AVAILABLE_FONTS;
  if (plano <= 0) return BASIC_PLAN_FONTS;

  const list = PLAN_FONTS[plano];
  if (!list || !list.length) return BASIC_PLAN_FONTS;

 
  const valid = list.filter((f) => AVAILABLE_FONTS.includes(f));
  return valid.length ? valid : BASIC_PLAN_FONTS;
}