import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gerarQrCode, consultarStatus } from "./compraApi";
import PlanSymbol from "../networkdemo/PlanSymbol";
import ConfirmarCompraModal from "./ConfirmarCompraModal";
import StarsBackdrop from "./StarBackdrop";
import styles from "./modules/AssinaturaQrCode.module.css";

const PLANOS_INFO = {
  1: { nome: "Hécate", model: "/models/hecate.glb", preco: "8,90 BRL" },
  2: { nome: "Artemis", model: "/models/artemis.glb", modelScale: 0.7, preco: "17,90 BRL" },
  3: { nome: "Selene", model: "/models/selene.glb", modelScale: 0.75, preco: "25,90 BRL" },
};

const POLLING_INTERVALO_MS = 5000;
const POLLING_TIMEOUT_MS = 5 * 60 * 1000;

function obterIdUsuarioLogado() {
  try {
    const usuario = JSON.parse(localStorage.getItem("user"));
    return usuario?.id ?? null;
  } catch {
    return null;
  }
}

export default function AssinaturaQrCode() {
  const { planoId } = useParams();
  const navigate = useNavigate();
  const planoInfo = PLANOS_INFO[planoId] ?? { nome: `Plano ${planoId}`, model: null, preco: null };

  const [idUsuario] = useState(() => obterIdUsuarioLogado());
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | carregando | aguardando | confirmado | expirado | erro
  const [copiado, setCopiado] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [verificandoAssinatura, setVerificandoAssinatura] = useState(true);
  const [jaPossuiAssinatura, setJaPossuiAssinatura] = useState(false);

  const intervaloRef = useRef(null);
  const timeoutRef = useRef(null);

  function pararPolling() {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  useEffect(() => () => pararPolling(), []);

  useEffect(() => {
    let ativo = true;

    async function verificarAssinaturaExistente() {
      if (!idUsuario) {
        setVerificandoAssinatura(false);
        return;
      }

      try {
        const dados = await consultarStatus(idUsuario);
        if (ativo && dados?.temAcesso) {
          setJaPossuiAssinatura(true);
        }
      } catch (erro) {
        console.error("Erro ao verificar assinatura existente:", erro);
      } finally {
        if (ativo) setVerificandoAssinatura(false);
      }
    }

    verificarAssinaturaExistente();

    return () => {
      ativo = false;
    };
  }, [idUsuario]);

  function iniciarPolling(usuario) {
    pararPolling();

    intervaloRef.current = setInterval(async () => {
      try {
        const dados = await consultarStatus(usuario);
        if (dados.temAcesso) {
          pararPolling();
          setStatus("confirmado");
        }
      } catch (erro) {
        console.error("Erro ao consultar status do pagamento:", erro);
      }
    }, POLLING_INTERVALO_MS);

    timeoutRef.current = setTimeout(() => {
      pararPolling();
      setStatus((atual) => (atual === "aguardando" ? "expirado" : atual));
    }, POLLING_TIMEOUT_MS);
  }

  async function handleGerarQrCode() {
    if (!idUsuario || jaPossuiAssinatura) {
      console.error("Tentativa de gerar QR code sem usuário logado ou já assinante.");
      return;
    }

    setStatus("carregando");
    setCopiado(false);

    try {
      const dados = await gerarQrCode(idUsuario, planoId);
      setQrData(dados);
      setStatus("aguardando");
      iniciarPolling(idUsuario);
    } catch (erro) {
      console.error("Erro ao gerar QR code:", erro);
      setStatus("idle");
    }
  }

  function handleConfirmarCompra() {
    if (jaPossuiAssinatura) {
      setMostrarModal(false);
      return;
    }
    setMostrarModal(false);
    handleGerarQrCode();
  }

  function handleCopiar() {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <StarsBackdrop />

      <div className={styles.page}>
        <div className={styles.winWindow}>
          <div className={styles.winTitleBar}>
            <span className={styles.winTitle}>Assinatura</span>
            <div className={styles.winControls}>
              <span className={styles.winBtn} />
              <span className={styles.winBtn} />
              <span className={`${styles.winBtn} ${styles.winClose}`} />
            </div>
          </div>

          <div className={styles.winBody}>
            <div className={styles.planoHeader}>
              {planoInfo.model && (
                <div className={styles.simboloWrap}>
                  <PlanSymbol model={planoInfo.model} scaleMultiplier={planoInfo.modelScale} />
                </div>
              )}
              <h1 className={styles.titulo}>Assinar {planoInfo.nome}</h1>
            </div>

            <div className={styles.divider} />

            {planoInfo.preco && (
              <div className={styles.precoRow}>
                <span className={styles.precoValor}>{planoInfo.preco}</span>
                <span className={styles.precoSub}>por mês</span>
              </div>
            )}

            {verificandoAssinatura && (
              <p className={styles.statusTexto}>Verificando assinatura...</p>
            )}

            {!verificandoAssinatura && jaPossuiAssinatura && (
              <div className={styles.sucesso}>
                <p>Você já possui uma assinatura ativa. Não é possível assinar outro plano enquanto ela estiver vigente.</p>
                <button
                  type="button"
                  className={styles.voltarSucesso}
                  onClick={() => navigate(-1)}
                >
                  Voltar
                </button>
              </div>
            )}

            {!verificandoAssinatura && !jaPossuiAssinatura && (
              <>
                {status === "idle" && (
                  <div className={styles.acoesTopo}>
                    <button
                      type="button"
                      className={styles.cancelar}
                      onClick={() => navigate(-1)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.botaoGerar}
                      onClick={() => setMostrarModal(true)}
                    >
                      Assinar {planoInfo.nome}
                    </button>
                  </div>
                )}

                {status === "carregando" && (
                  <button type="button" className={styles.botaoGerar} disabled>
                    Gerando...
                  </button>
                )}

                {qrData && status !== "confirmado" && (
                  <div className={styles.qrCard}>
                    <img
                      className={styles.qrImagem}
                      src={`data:image/png;base64,${qrData.qrcode}`}
                      alt="QR code Pix para pagamento"
                    />
                    <p className={styles.valor}>Valor: {qrData.valor} BRL</p>

                    <button type="button" className={styles.botaoCopiar} onClick={handleCopiar}>
                      {copiado ? "Copiado!" : "Copiar código Pix"}
                    </button>

                    {status === "aguardando" && (
                      <p className={`${styles.statusTexto} ${styles.aguardando}`}>
                        Aguardando confirmação do pagamento...
                      </p>
                    )}
                    {status === "expirado" && (
                      <p className={`${styles.statusTexto} ${styles.expirado}`}>
                        Tempo esgotado. Gere um novo QR code pra tentar novamente.
                      </p>
                    )}
                  </div>
                )}

                {status === "expirado" && (
                  <div className={styles.acoesTopo}>
                    <button
                      type="button"
                      className={styles.cancelar}
                      onClick={() => navigate(-1)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.botaoGerar}
                      onClick={() => setMostrarModal(true)}
                    >
                      Gerar novo QR code
                    </button>
                  </div>
                )}

                {status === "confirmado" && (
                  <div className={styles.sucesso}>
                    <p>Compra confirmada! Sua assinatura já está disponível para uso, aproveite!</p>
                    <button
                      type="button"
                      className={styles.voltarSucesso}
                      onClick={() => navigate("/home")}
                    >
                      Imergir
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmarCompraModal
        aberto={mostrarModal && !jaPossuiAssinatura}
        planoNome={planoInfo.nome}
        preco={planoInfo.preco}
        modelPath={planoInfo.model}
        modelScale={planoInfo.modelScale}
        carregando={status === "carregando"}
        onConfirmar={handleConfirmarCompra}
        onCancelar={() => setMostrarModal(false)}
      />
    </>
  );
}