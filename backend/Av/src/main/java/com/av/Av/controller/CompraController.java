package com.av.Av.controller;

import com.av.Av.Services.CompraService;
import com.av.Av.models.Compra;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/ApiAvCompra")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @Value("${builder.secret}")
    private String builderSecret;


    @GetMapping("/qrcode/{planoId}")
    public Map<String, String> gerarQrCode(@PathVariable Integer planoId, @RequestParam Integer idUsuario) {
        return compraService.gerarQrCode(idUsuario, planoId);
    }

    @GetMapping("/status/{idUsuario}")
    public Map<String, Object> statusAtivo(@PathVariable Integer idUsuario) {
        return compraService.statusAtivo(idUsuario);
    }

    @PostMapping("/builder/confirmar")
    public Compra confirmarPagamento(@RequestParam String txid, @RequestHeader("Builder-Key") String chave) {
        if (!builderSecret.equals(chave)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chave inválida");
        }
        return compraService.registerCompra(txid);
    }

    @PostMapping("/builder/conceder-admin")
    public Compra concederAdmin(@RequestParam Integer idUsuario, @RequestHeader("Builder-Key") String chave) {
        if (!builderSecret.equals(chave)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chave inválida");
        }
        return compraService.concederAcessoAdmin(idUsuario);
    }

}