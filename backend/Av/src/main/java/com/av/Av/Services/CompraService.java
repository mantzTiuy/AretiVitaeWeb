package com.av.Av.Services;

import com.av.Av.models.Compra;
import com.av.Av.models.Plano;
import com.av.Av.models.User;
import com.av.Av.repository.CompraRepository;
import com.av.Av.repository.PlanoRepository;
import com.av.Av.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CompraService {

    // Significado do campo "ativo": 0 = inativo/vencido | 1 = ativo (pago) | 2 = pendente (aguardando pagamento)
    private static final int PENDENTE = 2;
    private static final int ATIVO = 1;

    // Plano 4 = acesso ilimitado do dono da plataforma. Existe na tabela Plano só
    // porque a foreign key exige, mas gerarQrCode bloqueia ele explicitamente -
    // só é concedido via /compra/builder/conceder-admin, que exige a Builder-Key.
    private static final int PLANO_ADMIN = 4;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanoRepository planoRepository;

    @Autowired
    private PixQrCodeService pixQrCodeService;

    private static final DateTimeFormatter TXID_DATA = DateTimeFormatter.ofPattern("yyyyMMdd");


    public Map<String, String> gerarQrCode(Integer idUsuario, Integer plano) {
        if (plano.equals(PLANO_ADMIN)) {
            throw new IllegalArgumentException("Plano inválido: " + plano);
        }

        Plano planoEntity = planoRepository.findById(plano)
                .orElseThrow(() -> new IllegalArgumentException("Plano inválido: " + plano));
        BigDecimal preco = planoEntity.getValor();

        User user = userRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("USUARIO NAO ENCONTRADO: " + idUsuario));

        LocalDateTime limitePendenteValido = LocalDateTime.now().minusHours(1);
        Optional<Compra> pendenteRecente = compraRepository
                .findByUser_IdAndPlanoAndAtivo(idUsuario, plano, PENDENTE)
                .stream()
                .filter(c -> c.getCriadoEm().isAfter(limitePendenteValido))
                .findFirst();

        if (pendenteRecente.isPresent()) {
            Compra compra = pendenteRecente.get();
            String payload = pixQrCodeService.gerarPayload(compra.getValorPago(), compra.getTxid());
            String imagemBase64 = pixQrCodeService.gerarImagemBase64(payload);
            return Map.of(
                    "txid", compra.getTxid(),
                    "payload", payload,
                    "qrcode", imagemBase64,
                    "valor", compra.getValorPago().toString()
            );
        }

        String data = LocalDate.now().format(TXID_DATA);
        String valorCentavos = preco.movePointRight(2).stripTrailingZeros().toPlainString();
        String txid = "U" + idUsuario + "P" + plano + "V" + valorCentavos + "D" + data;

        LocalDate hoje = LocalDate.now();

        Compra compra = new Compra();
        compra.setUser(user);
        compra.setPlano(plano);
        compra.setDataCompra(hoje);
        compra.setDayVencimento(hoje.plusMonths(1));
        compra.setAtivo(PENDENTE);
        compra.setValorPago(preco);
        compra.setTxid(txid);
        compra.setCriadoEm(LocalDateTime.now());
        compraRepository.save(compra);

        String payload = pixQrCodeService.gerarPayload(preco, txid);
        String imagemBase64 = pixQrCodeService.gerarImagemBase64(payload);

        return Map.of(
                "txid", txid,
                "payload", payload,
                "qrcode", imagemBase64,
                "valor", preco.toString()
        );
    }


    /**
     * Concede acesso ilimitado (plano 4) direto pro usuário
     */
    public Compra concederAcessoAdmin(Integer idUsuario) {
        User user = userRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("USUARIO NAO ENCONTRADO: " + idUsuario));

        Optional<Compra> existente = compraRepository
                .findByUser_IdAndPlanoAndAtivo(idUsuario, PLANO_ADMIN, ATIVO)
                .stream()
                .findFirst();

        if (existente.isPresent()) {
            return existente.get();
        }

        LocalDate hoje = LocalDate.now();
        String data = hoje.format(TXID_DATA);
        String txid = "U" + idUsuario + "P" + PLANO_ADMIN + "V0D" + data;

        Compra compra = new Compra();
        compra.setUser(user);
        compra.setPlano(PLANO_ADMIN);
        compra.setDataCompra(hoje);
        compra.setDayVencimento(hoje.plusYears(100)); // na prática, nunca vence
        compra.setAtivo(ATIVO);
        compra.setValorPago(BigDecimal.ZERO);
        compra.setTxid(txid);
        compra.setCriadoEm(LocalDateTime.now());

        Compra salva = compraRepository.save(compra);

        user.setAssinatura(PLANO_ADMIN);
        userRepository.save(user);

        return salva;
    }


    public Map<String, Object> statusAtivo(Integer idUsuario) {
        List<Compra> ativas = compraRepository.findByUser_IdAndAtivo(idUsuario, ATIVO);

        if (ativas.isEmpty()) {
            return Map.of("temAcesso", false);
        }

        Compra compra = ativas.get(0);
        Plano plano = planoRepository.findById(compra.getPlano()).orElse(null);

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("temAcesso", true);
        resposta.put("plano", compra.getPlano());
        resposta.put("nomePlano", plano != null ? plano.getNome() : "desconhecido");
        resposta.put("dayVencimento", compra.getDayVencimento().toString());
        return resposta;
    }

    public Compra registerCompra(String txid) {
        Compra compra = compraRepository.findByTxid(txid)
                .orElseThrow(() -> new IllegalArgumentException("COBRANCA NAO ENCONTRADA: " + txid));

        if (compra.getAtivo() == ATIVO) {
            throw new IllegalStateException("PAGAMENTO JA REGISTRADO: " + txid);
        }

        LocalDate now = LocalDate.now();
        compra.setDataCompra(now);
        compra.setDayVencimento(now.plusMonths(1));
        compra.setAtivo(ATIVO);
        Compra salva = compraRepository.save(compra);

        User user = compra.getUser();
        user.setAssinatura(compra.getPlano());
        userRepository.save(user);

        return salva;
    }

    /**
     * Roda a cada 15 minutos: marca como expirada (ativo = 0) qualquer compra
     * que ficou PENDENTE por mais de 1 hora sem confirmação.
     */
    @Scheduled(fixedRate = 15 * 60 * 1000)
    public void expirarPendentesAntigas() {
        LocalDateTime limite = LocalDateTime.now().minusHours(1);
        List<Compra> pendentesExpiradas = compraRepository.findByAtivoAndCriadoEmBefore(PENDENTE, limite);

        pendentesExpiradas.forEach(c -> c.setAtivo(0));
        compraRepository.saveAll(pendentesExpiradas);
    }

    /**
     * Roda a cada 15 minutos: marca como vencida (ativo = 0) qualquer compra
     * ATIVA no qual o dayVencimento já passou, e zera a assinatura do usuário (0 = sem plano).
     * O PLANO_ADMIN tem dayVencimento definido 100 anos no futuro, então nunca
     * cai nessa lista
     */
    @Scheduled(fixedRate = 15 * 60 * 1000)
    public void expirarPlanosVencidos() {
        LocalDate hoje = LocalDate.now();
        List<Compra> vencidas = compraRepository.findByAtivoAndDayVencimentoBefore(ATIVO, hoje);

        for (Compra compra : vencidas) {
            compra.setAtivo(0);

            User user = compra.getUser();
            user.setAssinatura(0);
            userRepository.save(user);
        }

        compraRepository.saveAll(vencidas);
    }

}