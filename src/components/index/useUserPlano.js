import { useEffect, useState } from "react";
import axios from "axios";

export function useUserPlano() {
  const [plano, setPlano] = useState(0);
  const [loadingPlano, setLoadingPlano] = useState(true);

  useEffect(() => {
    let cancel = false;

    async function loadPlano() {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        if (!cancel) setLoadingPlano(false);
        return;
      }

      let userId;
      try {
        userId = JSON.parse(userStr).id;
      } catch {
        userId = null;
      }

      if (!userId) {
        if (!cancel) setLoadingPlano(false);
        return;
      }

      try {
        const { data } = await axios.get(`http://localhost:8081/ApiAvCompra/status/${userId}`);
        // Ajuste esta linha se a chave do plano no JSON de resposta do
        // statusAtivo() não for "plano" (ex: "nivel", "plan", "assinatura")
        if (!cancel) setPlano(Number(data?.plano ?? 0));
      } catch (er) {
        console.log("Erro ao carregar plano do usuário:", er);
        // Em caso de erro, trava tudo (plano 0) em vez de liberar por engano
        if (!cancel) setPlano(0);
      } finally {
        if (!cancel) setLoadingPlano(false);
      }
    }

    loadPlano();
    return () => { cancel = true; };
  }, []);

  return { plano, loadingPlano };
}