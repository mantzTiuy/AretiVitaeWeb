const loadedFonts      = new Set();
const pendingCallbacks = new Map();

const toLinkId = (fontFamily) => `gfont-${fontFamily.replace(/\s+/g, "-")}`;

export function loadGoogleFont(fontFamily, onLoaded) {
  if (!fontFamily) { onLoaded?.(); return; }

  if (loadedFonts.has(fontFamily)) {
    onLoaded?.();
    return;
  }

  const linkId = toLinkId(fontFamily);

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
    ]).then(finish).catch(finish);
  };
  link.onerror = finish;

  document.head.appendChild(link);
}

export function isFontLoaded(fontFamily) {
  return loadedFonts.has(fontFamily);
}