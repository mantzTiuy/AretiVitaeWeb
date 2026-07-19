export function getAbsoluteCenter(obj) {
  obj.setCoords();
  const m = obj.calcTransformMatrix();
  return { x: m[4], y: m[5] };
}

export function getAbsoluteEdge(obj, side) {
  const center = getAbsoluteCenter(obj);
  const hw = obj.getScaledWidth() / 2;
  return {
    x: side === "left" ? center.x - hw : center.x + hw,
    y: center.y,
  };
}

export function toCanvasPoint(cs, clientX, clientY) {
  const vpt = cs.viewportTransform;
  const zoom = cs.getZoom();
  return {
    x: (clientX - vpt[4]) / zoom,
    y: (clientY - vpt[5]) / zoom,
  };
}