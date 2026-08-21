import { useEffect, useMemo, useCallback } from "react";
import { GOOGLE_FONTS, DEFAULT_FONT, getPlanFonts } from "./fontConstants";
import { loadGoogleFont } from "./loadGoogleFont";

// Sem painel de "fontes favoritas": o plano do usuário já define
// diretamente o catálogo inteiro disponível (filtrado em planFonts.js).
// O usuário escolhe a fonte de cada texto pelo seletor em Settings.jsx.
export function useFontSelection(plano) {
  const planFonts = useMemo(() => getPlanFonts(plano), [plano]);

  // Catálogo mostrado no seletor de fonte (Settings.jsx), já filtrado
  // pelo plano — categorias que ficam vazias somem da lista.
  const fontsByCategory = useMemo(() => {
    return Object.fromEntries(
      Object.entries(GOOGLE_FONTS)
        .map(([categoria, fontes]) => [categoria, fontes.filter((f) => planFonts.includes(f))])
        .filter(([, fontes]) => fontes.length > 0)
    );
  }, [planFonts]);

  // Baixa as fontes do plano em segundo plano, pra já estarem prontas
  // quando o usuário abrir o seletor de fonte em Settings.jsx.
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