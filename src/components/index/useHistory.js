

export function createHistory({ cs, salvarMapa } = {}) {
  let undoStack = [];
  let redoStack = [];

  const push = (action) => {
    if (!action) return;
    undoStack.push(action);
    redoStack = [];
  };

  const undo = () => {
    const action = undoStack.pop();
    if (!action) return;
    cs?.discardActiveObject();
    action.undo();
    cs?.requestRenderAll();
    redoStack.push(action);
    salvarMapa?.();
  };

  const redo = () => {
    const action = redoStack.pop();
    if (!action) return;
    cs?.discardActiveObject();
    action.redo();
    cs?.requestRenderAll();
    undoStack.push(action);
    salvarMapa?.(); 
  };

  const clear = () => {
    undoStack = [];
    redoStack = [];
  };

  const hasUndo = () => undoStack.length > 0;
  const hasRedo = () => redoStack.length > 0;

  return { push, undo, redo, clear, hasUndo, hasRedo };
}


export const makeAddAction = (cs, obj, { toBack = false } = {}) => ({
  undo: () => cs.remove(obj),
  redo: () => {
    cs.add(obj);
    if (toBack) cs.sendObjectToBack(obj);
  },
});


export const makeRemoveAction = (cs, obj, { toBack = false } = {}) => ({
  undo: () => {
    cs.add(obj);
    if (toBack) cs.sendObjectToBack(obj);
  },
  redo: () => cs.remove(obj),
});

export const combineActions = (actions) => ({
  undo: () => {
    for (let i = actions.length - 1; i >= 0; i--) actions[i].undo();
  },
  redo: () => {
    for (let i = 0; i < actions.length; i++) actions[i].redo();
  },
});