// Carrega fontes do Google Fonts em tempo de execução, sem precisar dar
// import de arquivo de fonte no bundle. Cada fonte só é buscada uma vez
// (cache em memória via `loadedFonts`), e o callback só dispara depois que
// o navegador confirma que ela está pronta pra ser usada — sem isso, o
// primeiro requestRenderAll do canvas ainda desenharia com a fonte de
// fallback.
const loadedFonts      = new Set();
const pendingCallbacks = new Map(); // fontFamily -> callbacks enfileirados enquanto carrega

const toLinkId = (fontFamily) => `gfont-${fontFamily.replace(/\s+/g, "-")}`;

export function loadGoogleFont(fontFamily, onLoaded) {
  if (!fontFamily) { onLoaded?.(); return; }

  if (loadedFonts.has(fontFamily)) {
    onLoaded?.();
    return;
  }

  const linkId = toLinkId(fontFamily);

  // Já tem um <link> pra essa fonte (carregando ou já carregado antes desta
  // sessão do módulo) — só enfileira o callback em vez de duplicar o link.
  if (document.getElementById(linkId)) {
    const queued = pendingCallbacks.get(fontFamily);
    if (queued) {
      queued.push(onLoaded);
    } else {
      onLoaded?.();
    }
    return;
  }

  pendingCallbacks.set(fontFamily, onLoaded ? [onLoaded] : []);

  const link = document.createElement("link");
  link.id  = linkId;
  link.rel = "stylesheet";
  const familyParam = fontFamily.trim().replace(/\s+/g, "+");
  link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;500;700&display=swap`;

  const finish = () => {
    loadedFonts.add(fontFamily);
    const callbacks = pendingCallbacks.get(fontFamily) ?? [];
    pendingCallbacks.delete(fontFamily);
    callbacks.forEach((cb) => cb?.());
  };

  link.onload = () => {
    Promise.all([
      document.fonts.load(`400 16px "${fontFamily}"`),
      document.fonts.load(`700 16px "${fontFamily}"`),
    ]).then(finish).catch(finish); // mesmo se o load() falhar, não trava a UI
  };
  link.onerror = finish;

  document.head.appendChild(link);
}

export function isFontLoaded(fontFamily) {
  return loadedFonts.has(fontFamily);
}