package com.av.Av.models;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = Plano.TABLE_NAME)
public class Plano {

    public static final String TABLE_NAME = "AretiVitae_Plano";

    @Id
    @Column(name = "id")
    private Integer id;

    @Column(name = "nome", unique = true)
    private String nome;

    @Column(name = "valor", nullable = false)
    private BigDecimal valor;

    public Plano() {
    }

    public Plano(Integer id, String nome, BigDecimal valor) {
        this.id = id;
        this.nome = nome;
        this.valor = valor;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }
}