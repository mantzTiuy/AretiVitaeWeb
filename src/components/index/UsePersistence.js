import axios from "axios";
import { API_BASE, generateId } from "./constants";

// Fábrica que recebe tudo que salvarMapa/carregarMapa precisam de fora
// (id da rota, refs, setters de estado, o SELECTION_STYLE e as funções
// clearPorts/createConnection vindas do módulo de portas e conexões).
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
      // 1. Remove portas do canvas antes de serializar
      clearPorts();

      // 2. Garante _id em todo objeto "de verdade" (não porta, não linha)
      cs.getObjects().forEach((obj) => {
        if (obj._isPort || obj.isLine) return;
        if (!obj._id) obj._id = generateId();
      });

      // 3. Extrai conexões sem duplicar (usa os _id garantidos acima)
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

      // 4. Serializa o canvas da forma padrão do Fabric.
      //    IMPORTANTE: no Fabric 7.x, passar uma lista de propriedades
      //    customizadas para cs.toJSON(propertiesToInclude) NÃO está
      //    capturando props atribuídas diretamente na instância
      //    (obj.blockId = ...) — o campo vinha undefined no JSON gerado.
      //    Por isso, em vez de confiar nesse mecanismo, serializamos "cru"
      //    e injetamos os metadados manualmente logo abaixo, por POSIÇÃO,
      //    já que cs.toJSON().objects preserva exatamente a mesma ordem
      //    de cs.getObjects().
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

        enrichedObjects.push(json);
      });
      canvasJson.objects = enrichedObjects;

      console.log("SALVANDO connections:", connections);
      console.log("SALVANDO blockIds:", canvasJson.objects.map(o => o.blockId));

      // ── Validação de integridade ANTES de enviar ao backend ─────────────
      const savedBlockIds = new Set(canvasJson.objects.map(o => o.blockId));
      connections.forEach(({ sourceId, targetId }) => {
        if (!savedBlockIds.has(sourceId) || !savedBlockIds.has(targetId)) {
          console.error(
            "[INTEGRIDADE] Conexão referencia bloco que NÃO está sendo salvo!",
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

  // ── CARREGAR MAPA ────────────────────────────────────────────────────────
  // Recebe `cs` (a instância viva do canvas) e `cancelledRef` (ref booleano
  // que o efeito do componente marca como true no cleanup) para poder abortar
  // com segurança, já que essa função é assíncrona.
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

        // ── Restaura _id de forma robusta (correlação por POSIÇÃO) ─────────
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
          } else if (!obj._id && !obj._isPort && !obj.isLine) {
            obj._id = generateId();
          }

          // ── Reaplica o estilo de seleção/handles (SELECTION_STYLE) ─────────
          if (!obj._isPort && !obj.isLine) {
            obj.set(SELECTION_STYLE);
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