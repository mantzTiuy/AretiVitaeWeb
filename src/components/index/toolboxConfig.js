export const TOOLBOX_BTN_SIZE = 32;
export const TOOLBOX_RADIUS   = 4;
export const TOOLBOX_GAP      = 6;

export const TOOLBOX_PADDING_X = 6;
export const TOOLBOX_BORDER    = 1;

// Largura total da toolbox
export const TOOLBOX_WIDTH =
  TOOLBOX_BTN_SIZE + TOOLBOX_PADDING_X * 2 + TOOLBOX_BORDER * 2;

export const TOOLBOX_ICON_SIZE = 22;

export const TOOLBOX_ICON_SIZES = {
  addBox:       40,
  addText:      32,
  addContainer: 72,
  center:       36,
  media:        32,
  brush:        32,
  eraser:       36,
  undo:         40,
  redo:         36,
  save:         34,
  exportSvg:    68,
  settings:     36,
};

export function getIconSize(modelKey) {
  return TOOLBOX_ICON_SIZES[modelKey] ?? TOOLBOX_ICON_SIZE;
}

export const TOOLBOX_ICON_ROTATION = [18, -31, 0];

export const TOOLBOX_ICON_ROTATIONS = {
  addBox:       [18, -31, 155],
  addText:      [18, -31, 0],
  addContainer: [15, 105, 0],
  center:       [18, 90, 0],
  media:        [10, 270, 10],
  brush:        [-10, 270, 0],
  eraser:       [18, -31, 0],
  undo:         [0, 90, 0],
  redo:         [0, 90, 0],
  save:         [-15, 270, 0],
  exportSvg:    [25, 310, 0],
  settings:     [20, 90, 0],
};

export function getIconRotation(modelKey) {
  const deg = TOOLBOX_ICON_ROTATIONS[modelKey] ?? TOOLBOX_ICON_ROTATION;
  return deg.map((d) => (d * Math.PI) / 180);
}

// Painel de W/H — agora fixo no topo, largura suficiente pra não estourar
export const SETTINGS_PANEL_WIDTH  = 150;
export const SETTINGS_PANEL_RADIUS = 6;
export const SETTINGS_PANEL_GAP    = 6;
export const SETTINGS_PANEL_OFFSET = TOOLBOX_WIDTH; // mantido por compatibilidade, não é mais usado no posicionamento