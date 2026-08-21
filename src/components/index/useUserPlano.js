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
       
        if (!cancel) setPlano(Number(data?.plano ?? 0));
      } catch (er) {
        console.log("Erro ao carregar plano do usuário:", er);
     
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