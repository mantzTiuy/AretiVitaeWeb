import axios from "axios";
import { API_BASE, generateId, noRotate } from "./constants";

//Recebe tudo relacionado ao salvamento de mapas
export function createPersistence({
  id,
  canvasInstanceRef,
  isLoadingFromJsonRef,
  setSaveStatus,
  setErroMap,
  setLoadingMap,
  clearPorts,
  createConnection,
  SELECTION_STYLE,
}) {
  // ── SALVAR MAPA ──────────────────────────────────────────────────────────
  async function salvarMapa() {
    const cs = canvasInstanceRef.current;
    if (!cs) return;
    setSaveStatus('saving');
    try {
      //Remove portas do canvas antes de serializar (evitar de salvar com portas erradas)
      clearPorts();

      //Garante id em todo objeto que não seja porta ou linha
      cs.getObjects().forEach((obj) => {
        if (obj._isPort || obj.isLine) return;
        if (!obj._id) obj._id = generateId();
      });

      //Extrai conexões
      const connections = [];
      const seen = new Set();
      cs.getObjects().forEach((obj) => {
        if (!obj.connections?.length) return;
        obj.connections.forEach((conn) => {
          if (seen.has(conn)) return;
          seen.add(conn);
          connections.push({
            sourceId: conn.sourceBlock._id,
            targetId: conn.targetBlock._id,
            fromSide: conn.fromSide,
            toSide: conn.toSide,
          });
        });
      });

      //serializa o canvas pra json :D
      const canvasJson = cs.toJSON();

      const liveObjects = cs.getObjects();
      const enrichedObjects = [];
      liveObjects.forEach((obj, i) => {
        if (obj._isPort || obj.isLine) return; // não persiste portas/linhas
        const json = canvasJson.objects[i];
        if (!json) return;

        json.blockId = obj._id;
        json.blockType = obj._blockType ?? null;
        json.isLabel = obj._isLabel ?? false;
        json.isBackground = obj._isBackground ?? false;
        json.linkedId =
          obj._isLabel && obj._linkedBg
            ? (obj._linkedBg._id ?? null)
            : obj._isBackground && obj._linkedLabel
            ? (obj._linkedLabel._id ?? null)
            : null;

        // Dados de mídia (usados pelos cards de imagem/PDF em
        // useMediaImporter.js). sourceName/isPdf são leves e sempre
        // salvos quando existem; pdfDataUrl (o base64 do arquivo) só é
        // incluído quando o bloco de fato é um PDF, pra não inflar o
        // JSON dos blocos comuns.
        if (obj._blockType === "media") {
          json.isPdf = obj._isPdf ?? false;
          json.sourceName = obj._sourceName ?? null;
          if (obj._isPdf) {
            json.pdfDataUrl = obj._pdfDataUrl ?? null;
          }
        }

        enrichedObjects.push(json);
      });
      canvasJson.objects = enrichedObjects;

      console.log("SALVANDO connections:", connections);
      console.log("SALVANDO blockIds:", canvasJson.objects.map(o => o.blockId));

      // Validação de INTEGRIDADE ANTES de enviar pro BACKEND
      const savedBlockIds = new Set(canvasJson.objects.map(o => o.blockId));
      connections.forEach(({ sourceId, targetId }) => {
        if (!savedBlockIds.has(sourceId) || !savedBlockIds.has(targetId)) {
          console.error(
            "Conexão referencia do  bloco que não está sendo salvo!",
            { sourceId, targetId, savedBlockIds: [...savedBlockIds] }
          );
        }
      });

      const dataAtual = JSON.stringify({ canvasJson, connections });

      await axios.put(`${API_BASE}/update/${id}`, {
        data: dataAtual,
      });

      setSaveStatus('saved');
    } catch (error) {
      console.log('ERRO AO SALVAR MAPA:', error);
      setSaveStatus('error');
    }
  }

  // CARREGAR MAPA 
  // Recebe `cs` (a instância do canvas) e "cancelledRef" (ref boolean
  // que o efeito do componente marca como true no clean do canvas) para poder abortar
  // com segurança sem que tenha problemas como json cortado ao meio sendo mandado pro backend
  async function carregarMapa(cs, cancelledRef) {
    try {
      const { data } = await axios.get(`${API_BASE}/${id}`);

      if (cancelledRef.current) return;

      if (data?.data) {
        let parsed;
        try {
          parsed = JSON.parse(data.data);
        } catch {
          parsed = null;
        }

        const canvasJson = parsed?.canvasJson ?? data.data;
        const connections = parsed?.connections ?? [];

        isLoadingFromJsonRef.current = true;

        await cs.loadFromJSON(canvasJson);

        if (cancelledRef.current || !canvasInstanceRef.current) {
          isLoadingFromJsonRef.current = false;
          return;
        }

        isLoadingFromJsonRef.current = false;

        // Restaura _id de forma robusta (correlação através da POSIÇÃO) 
        const savedObjects = canvasJson.objects ?? [];
        const loadedObjects = cs.getObjects();

        if (savedObjects.length !== loadedObjects.length) {
          console.warn(
            "Divergência entre objetos salvos e carregados:",
            savedObjects.length, "vs", loadedObjects.length
          );
        }

        loadedObjects.forEach((obj, i) => {
          const meta = savedObjects[i];
          const blockId = obj.blockId || meta?.blockId;

          if (blockId) {
            obj._id = blockId;
            obj._blockType = obj.blockType ?? meta?.blockType ?? obj._blockType;
            obj._isLabel = obj.isLabel ?? meta?.isLabel ?? false;
            obj._isBackground = obj.isBackground ?? meta?.isBackground ?? false;
            obj._linkedIdRaw = obj.linkedId ?? meta?.linkedId ?? null;

            // Restaura metadados de mídia (imagem/PDF), na mesma linha do
            // primeiro
            // tenta pegar do próprio obj (caso o Fabric já tenha colocado
            // a prop lá), senão cai pro JSON salvo
            if (obj._blockType === "media") {
              obj._isPdf = obj.isPdf ?? meta?.isPdf ?? false;
              obj._sourceName = obj.sourceName ?? meta?.sourceName ?? null;
              obj._pdfDataUrl = obj.pdfDataUrl ?? meta?.pdfDataUrl ?? null;
            }
          } else if (!obj._id && !obj._isPort && !obj.isLine) {
            obj._id = generateId();
          }

          // ── Reaplica o estilo de seleção/handles (SELECTION_STYLE) ─────────
          if (!obj._isPort && !obj.isLine) {
            obj.set(SELECTION_STYLE);
            noRotate(obj); // garante que o handle de rotação some também após reload
          }
        });

        // Índice id → objeto
        const objById = {};
        cs.getObjects().forEach((obj) => {
          if (obj._id) objById[obj._id] = obj;
        });

        console.log("CARREGANDO objById keys:", Object.keys(objById));
        console.log("CARREGANDO connections:", connections);

        // Reconecta _linkedBg  _isLabel usando linkedId (por ID, não por referência)
        cs.getObjects().forEach((obj) => {
          if (!obj._linkedIdRaw) return;
          const other = objById[obj._linkedIdRaw];
          if (!other) return;
          if (obj._isLabel) {
            obj._linkedBg = other;
            other._linkedLabel = obj;
          } else if (obj._isBackground) {
            obj._linkedLabel = other;
            other._linkedBg = obj;
          }
        });

        // Remove linhas fantasma restauradas pelo Fabric
        cs.getObjects()
          .filter((o) => o.isLine)
          .forEach((l) => cs.remove(l));

        // Força cálculo de coordenadas antes de criar as linhas
        cs.renderAll();
        cs.getObjects().forEach((obj) => obj.setCoords());

        connections.forEach(({ sourceId, targetId, fromSide, toSide }) => {
          const source = objById[sourceId];
          const dest = objById[targetId];
          if (!source || !dest) {
            console.warn("Bloco não encontrado:", sourceId, targetId);
            return;
          }
          createConnection(source, dest, fromSide, toSide);
        });

        cs.requestRenderAll();
      }
    } catch (error) {
      if (cancelledRef.current) return;
      console.log('ERRO AO CARREGAR MAPA:', error);
      setErroMap('Não foi possível carregar esse mapa.');
    } finally {
      if (!cancelledRef.current) setLoadingMap(false);
    }
  }

  return { salvarMapa, carregarMapa };
}