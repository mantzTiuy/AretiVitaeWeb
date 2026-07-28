package com.av.Av.Services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;

@Service
public class PixQrCodeService {

    // Dados fixos do recebedor (você) - troque pelos seus dados reais
    private static final String CHAVE_PIX = "jaojaojaotiuytiuytiuy@gmail.com"; // CPF, email, telefone ou chave aleatória
    private static final String NOME_RECEBEDOR = "Joao Mantz de Oliveira";  // max 25 caracteres, sem acento
    private static final String CIDADE_RECEBEDOR = "Limeira";       // max 15 caracteres, sem acento

    /**
     * Gera o payload "Pix Copia e Cola"
     * gera o valor da cobrança
     */
    public String gerarPayload(BigDecimal valor, String txid) {
        String valorFormatado = valor.setScale(2, RoundingMode.HALF_UP).toPlainString();
        String txidLimpo = (txid == null || txid.isBlank()) ? "***" : txid.replaceAll("[^a-zA-Z0-9]", "");

        String merchantAccountInfo =
                campo("00", "br.gov.bcb.pix") +
                        campo("01", CHAVE_PIX);

        String additionalData = campo("05", txidLimpo);

        String payloadSemCrc =
                campo("00", "01") +                          // Payload Format Indicator
                        campo("26", merchantAccountInfo) +            // Merchant Account Info (Pix)
                        campo("52", "0000") +                          // Merchant Category Code
                        campo("53", "986") +                            // Moeda (BRL)
                        campo("54", valorFormatado) +                   // Valor da transação
                        campo("58", "BR") +                             // País
                        campo("59", NOME_RECEBEDOR) +                   // Nome do recebedor
                        campo("60", CIDADE_RECEBEDOR) +                 // Cidade do recebedor
                        campo("62", additionalData) +                   // Dados adicionais (txid)
                        "6304";                                          // Início do campo do CRC (sem o valor ainda)

        String crc = calcularCRC16(payloadSemCrc);
        return payloadSemCrc + crc;
    }

    /** Gera a imagem do QR code (PNG) em Base64, pronta pra exibir num <img src="data:image/png;base64,..."> */
    public String gerarImagemBase64(String payload) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(payload, BarcodeFormat.QR_CODE, 300, 300);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Erro ao gerar QR code", e);
        }
    }

    private String campo(String id, String valor) {
        String tamanho = String.format("%02d", valor.length());
        return id + tamanho + valor;
    }

    private String calcularCRC16(String payload) {
        int polinomio = 0x1021;
        int resultado = 0xFFFF;

        byte[] bytes = payload.getBytes();
        for (byte b : bytes) {
            resultado ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                if ((resultado & 0x8000) != 0) {
                    resultado = (resultado << 1) ^ polinomio;
                } else {
                    resultado <<= 1;
                }
                resultado &= 0xFFFF;
            }
        }
        return String.format("%04X", resultado);
    }
}