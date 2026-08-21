// ──────────────────────────────────────────────────────────────
// Personalize aqui quais fontes cada plano libera no seletor de
// fonte (dentro de Settings.jsx). Toda fonte listada precisa
// existir em GOOGLE_FONTS (googleFonts.js) — nomes errados são
// ignorados automaticamente por fontConstants.js, sem quebrar o
// seletor.
//
// Plano 0 (Básico)  -> sempre só Josefin Sans (fixo, não é editável aqui).
// Plano 1 (Hécate)  -> lista abaixo.
// Plano 2 (Artemis) -> lista abaixo.
// Plano 3 (Selene)  -> libera o catálogo inteiro, não precisa editar aqui.
// ──────────────────────────────────────────────────────────────

export const PLAN_FONTS = {
  1: [ // Hécate — 10 fontes
    "Josefin Sans",
    "Roboto",
    "Montserrat",
    "Playfair Display",
    "Caveat",
    "Open Sans",
    "JetBrains Mono",
    "Inter",
    "Pacifico",
    "Nunito",
  ],
  2: [ // Artemis — 30 fontes
    // Sem serifa
    "Josefin Sans", "Roboto", "Open Sans", "Montserrat", "Poppins",
    "Inter", "Nunito", "Work Sans",
    // Serifada
    "Playfair Display", "Merriweather", "Lora", "PT Serif",
    "Cormorant Garamond", "EB Garamond",
    // Display
    "Bebas Neue", "Oswald", "Anton", "Righteous", "Fredoka", "Abril Fatface",
    // Manuscrita
    "Caveat", "Dancing Script", "Pacifico", "Sacramento", "Great Vibes", "Satisfy",
    // Monoespaçada
    "Roboto Mono", "Space Mono", "JetBrains Mono", "Fira Code",
  ],
};