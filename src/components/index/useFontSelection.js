import { useEffect, useMemo, useCallback } from "react";
import { GOOGLE_FONTS, DEFAULT_FONT, getPlanFonts } from "./fontConstants";
import { loadGoogleFont } from "./loadGoogleFont";


export function useFontSelection(plano) {
  const planFonts = useMemo(() => getPlanFonts(plano), [plano]);

 
  const fontsByCategory = useMemo(() => {
    return Object.fromEntries(
      Object.entries(GOOGLE_FONTS)
        .map(([categoria, fontes]) => [categoria, fontes.filter((f) => planFonts.includes(f))])
        .filter(([, fontes]) => fontes.length > 0)
    );
  }, [planFonts]);

  
  const preloadFontPreviews = useCallback(() => {
    planFonts.forEach((font) => loadGoogleFont(font));
  }, [planFonts]);

  useEffect(() => {
    preloadFontPreviews();
  }, [preloadFontPreviews]);

  return {
    fontsByCategory,
    defaultFont: DEFAULT_FONT,
  };
}