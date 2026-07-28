const API_BASE = "http://localhost:8081";

export async function gerarQrCode(idUsuario, planoId) {
  const resposta = await fetch(
    `${API_BASE}/ApiAvCompra/qrcode/${planoId}?idUsuario=${idUsuario}`
  );

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(texto || "Não foi possível gerar o QR code.");
  }

  return resposta.json();
}

export async function consultarStatus(idUsuario) {
  const resposta = await fetch(`${API_BASE}/ApiAvCompra/status/${idUsuario}`);

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o status da assinatura.");
  }

  return resposta.json();
}