package com.av.Av.models;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = Compra.TABLE_NAME)
public class Compra {

    public static final String TABLE_NAME = "AretiVitae_Compra";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", unique = true)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    private User user;

    @Column(name = "plano")
    private Integer plano;

    @Column(name = "dataCompra", nullable = false)
    private LocalDate dataCompra;

    @Column(name = "dayVencimento")
    private LocalDate dayVencimento;

    @Column(name = "ativo")
    private Integer ativo;

    @Column(name = "valor_pago", nullable = false)
    private BigDecimal valorPago;

    @Column(name = "txid", nullable = false, unique = true)
    private String txid;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    public Compra(Integer id, User user, Integer plano, LocalDate dataCompra, LocalDate dayVencimento, Integer ativo, BigDecimal valorPago, String txid) {
        this.id = id;
        this.user = user;
        this.plano = plano;
        this.dataCompra = dataCompra;
        this.dayVencimento = dayVencimento;
        this.ativo = ativo;
        this.valorPago = valorPago;
        this.txid = txid;
    }

    public Compra() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getPlano() {
        return plano;
    }

    public void setPlano(Integer plano) {
        this.plano = plano;
    }

    public LocalDate getDataCompra() {
        return dataCompra;
    }

    public void setDataCompra(LocalDate dataCompra) {
        this.dataCompra = dataCompra;
    }

    public LocalDate getDayVencimento() {
        return dayVencimento;
    }

    public void setDayVencimento(LocalDate dayVencimento) {
        this.dayVencimento = dayVencimento;
    }

    public Integer getAtivo() {
        return ativo;
    }

    public void setAtivo(Integer ativo) {
        this.ativo = ativo;
    }

    public BigDecimal getValorPago() {
        return valorPago;
    }

    public void setValorPago(BigDecimal valorPago) {
        this.valorPago = valorPago;
    }

    public String getTxid() {
        return txid;
    }

    public void setTxid(String txid) {
        this.txid = txid;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}