import { useEffect, useRef } from "react";
import * as fabric from "fabric";

const SNAP_THRESHOLD = 6; // Pixeis da tela de distância de dois blocos, menos que 6 eles grudam automatico
const GUIDE_COLOR    = "#5083ef";
const GUIDE_EXTEND   = 20; // quanto a guia se estende além do container envolvido na interação

export default function Axis({ canvasReady, onReady }) {
  const guidesRef = useRef([]);//Não precisa renderizar denovo, então se usa ref para redraw as interações da tela

  useEffect(() => {//Só quando o canvas já existe
    const cs = canvasReady;
    if (!cs) return;

    // Pega o centro real dos blocos, considerando o pan e o zoom, faz isso a partir do seguinte calculo:
    const getAbsoluteCenter = (obj) => {
      obj.setCoords();
      const m = obj.calcTransformMatrix();
      return { x: m[4], y: m[5] };
    };


    //Pega todos os parametros de um objeto como um bloco
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
        if (obj === excludeBlock) return false;//Não compara com nada excluido
        if (obj._isPort || obj.isLine || obj._isGuide) return false;//Ignora o que não é bloco
        if (obj._isBackground) return false;//Ignora background (inclui o retângulo dos containers)
        if (obj._isContainerLabel) return false;//Ignora o nome do container também
        return true;
      });

    //Esvazia o array e remove as linhas quando não necessárias
    const clearGuides = () => {
      guidesRef.current.forEach((l) => cs.remove(l));
      guidesRef.current = [];
    };

    //Draw o plano cartesiano com os eixos V e H (feito para não confundir incialmente)
    const drawGuide = (orientation, pos, from, to) => {
     //V = X
     //H = Y
      const coords =
        orientation === "v" ? [pos, from, pos, to] : [from, pos, to, pos];


        //Constroe as linhas com base no plano cartesiano anterior
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

    //Impõe as restrições e faz com que os blocos travem dependendo da posição relativa, causando o efeito de alinhamento
    const checkAlignment = (target) => {
      clearGuides();//Limpa os guias anteriores
      if (!target || target._isPort || target.isLine || target._isGuide) return;
      if (target.type === "activeselection") return; // Selection de vários não funciona

      const zoom      = cs.getZoom();
      const threshold = SNAP_THRESHOLD / zoom;//Converte os pixeis da tela (THRESHOLD) em pixeis do canvas (Biblioteca que não vem com nada pronto é complicado)
      //THRESHOLD são pixeis grandes

      const tBounds     = getBounds(target); //O objeto selecionado e bounded
      const candidates  = getSnapCandidates(target); //Candidates são os outros blocos de parametro para o alinhamento
    //Isso faz com que independentemente do zoom e pan, o alinhamento parece igual
      let snapX = null;
      let snapY = null;

      const xRefs = [tBounds.left, tBounds.centerX, tBounds.right];
      const yRefs = [tBounds.top, tBounds.centerY, tBounds.bottom];
      //Possibilidades de movimento

      candidates.forEach((other) => {//Referencias de onde o bloco pode se alinhar
        const oBounds = getBounds(other);
        const oxRefs  = [oBounds.left, oBounds.centerX, oBounds.right];
        const oyRefs  = [oBounds.top, oBounds.centerY, oBounds.bottom];

        //Verifica isso para candidato nos eixos do plano
        xRefs.forEach((val) => {
          oxRefs.forEach((oVal) => {
            const diff = oVal - val;
            if (
              Math.abs(diff) < threshold && // Se a diferença entre o bound e o candidato for menor que theshhold, ele ativa a condição e alinha os objetos
              (snapX === null || Math.abs(diff) < Math.abs(snapX.delta))
            ) {
              snapX = {
                delta: diff, // Define a diferença entre o candidate e o bound
                guidePos: oVal,
                range: [
                  Math.min(tBounds.top, oBounds.top) - GUIDE_EXTEND,
                  Math.max(tBounds.bottom, oBounds.bottom) + GUIDE_EXTEND,
                ],
              };
            }
          });
        });

        yRefs.forEach((val) => {//Mesma coisa do X
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

      //Condições que escrevem de fato a linha na tela e set novas coordenadas para o bloco com base no alinhamento
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

  // Componente não renderiza nada visualmente — atua só via eventos do canvas
  return null;
}