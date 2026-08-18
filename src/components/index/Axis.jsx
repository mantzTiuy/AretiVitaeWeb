import { useEffect, useRef } from "react";
import * as fabric from "fabric";

const SNAP_THRESHOLD = 6;
const GUIDE_COLOR    = "#5083ef";
const GUIDE_EXTEND   = 20;

export default function Axis({ canvasReady, onReady }) {
  const guidesRef = useRef([]);

  useEffect(() => {
    const cs = canvasReady;
    if (!cs) return;

    const getAbsoluteCenter = (obj) => {
      obj.setCoords();
      const m = obj.calcTransformMatrix();
      return { x: m[4], y: m[5] };
    };

    const getBounds = (obj) => {
      const center = getAbsoluteCenter(obj);
      const hw = obj.getScaledWidth()  / 2;
      const hh = obj.getScaledHeight() / 2;
      return {
        left:    center.x - hw,
        right:   center.x + hw,
        top:     center.y - hh,
        bottom:  center.y + hh,
        centerX: center.x,
        centerY: center.y,
      };
    };

    const getSnapCandidates = (excludeBlock) =>
      cs.getObjects().filter((obj) => {
        if (obj === excludeBlock) return false;
        if (obj._isPort || obj.isLine || obj._isGuide) return false;
        if (obj._isBackground) return false;
        if (obj._isContainerLabel) return false;
        if (obj._isDrawing) return false;
        return true;
      });

    const clearGuides = () => {
      guidesRef.current.forEach((l) => cs.remove(l));
      guidesRef.current = [];
    };

    const drawGuide = (orientation, pos, from, to) => {
      const coords =
        orientation === "v" ? [pos, from, pos, to] : [from, pos, to, pos];

      const line = new fabric.Line(coords, {
        stroke:      GUIDE_COLOR,
        strokeWidth: 1,
        selectable:  false,
        evented:     false,
        isLine:      true,
        _isGuide:    true,
      });
      cs.add(line);
      cs.bringObjectToFront(line);
      guidesRef.current.push(line);
    };

    const checkAlignment = (target) => {
      clearGuides();
      if (!target || target._isPort || target.isLine || target._isGuide) return;
      if (target._isDrawing) return;
      if (target.type === "activeselection") return;

      const zoom      = cs.getZoom();
      const threshold = SNAP_THRESHOLD / zoom;

      const tBounds     = getBounds(target);
      const candidates  = getSnapCandidates(target);

      let snapX = null;
      let snapY = null;

      const xRefs = [tBounds.left, tBounds.centerX, tBounds.right];
      const yRefs = [tBounds.top, tBounds.centerY, tBounds.bottom];

      candidates.forEach((other) => {
        const oBounds = getBounds(other);
        const oxRefs  = [oBounds.left, oBounds.centerX, oBounds.right];
        const oyRefs  = [oBounds.top, oBounds.centerY, oBounds.bottom];

        xRefs.forEach((val) => {
          oxRefs.forEach((oVal) => {
            const diff = oVal - val;
            if (
              Math.abs(diff) < threshold &&
              (snapX === null || Math.abs(diff) < Math.abs(snapX.delta))
            ) {
              snapX = {
                delta: diff,
                guidePos: oVal,
                range: [
                  Math.min(tBounds.top, oBounds.top) - GUIDE_EXTEND,
                  Math.max(tBounds.bottom, oBounds.bottom) + GUIDE_EXTEND,
                ],
              };
            }
          });
        });

        yRefs.forEach((val) => {
          oyRefs.forEach((oVal) => {
            const diff = oVal - val;
            if (
              Math.abs(diff) < threshold &&
              (snapY === null || Math.abs(diff) < Math.abs(snapY.delta))
            ) {
              snapY = {
                delta: diff,
                guidePos: oVal,
                range: [
                  Math.min(tBounds.left, oBounds.left) - GUIDE_EXTEND,
                  Math.max(tBounds.right, oBounds.right) + GUIDE_EXTEND,
                ],
              };
            }
          });
        });
      });

      if (snapX) {
        target.set({ left: target.left + snapX.delta });
        target.setCoords();
        drawGuide("v", snapX.guidePos, snapX.range[0], snapX.range[1]);
      }
      if (snapY) {
        target.set({ top: target.top + snapY.delta });
        target.setCoords();
        drawGuide("h", snapY.guidePos, snapY.range[0], snapY.range[1]);
      }

      cs.requestRenderAll();
    };

    onReady?.(checkAlignment);

    const onMoveEnd = () => {
      clearGuides();
      cs.requestRenderAll();
    };

    cs.on("mouse:up",          onMoveEnd);
    cs.on("selection:cleared", onMoveEnd);

    return () => {
      cs.off("mouse:up",          onMoveEnd);
      cs.off("selection:cleared", onMoveEnd);
      clearGuides();
      onReady?.(null);
    };
  }, [canvasReady, onReady]);

  return null;
}