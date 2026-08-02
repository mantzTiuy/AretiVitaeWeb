package com.av.Av.models;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.antlr.v4.runtime.misc.NotNull;

import java.util.Objects;
@Entity
@Table(name = UserMap.TABLE_NAME)
public class UserMap {
    public static final String TABLE_NAME = "AretiVitae_map";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", unique = true)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "userid")
    @JsonIgnoreProperties({"idade", "email", "senha", "assinatura", "ativo", "tipoRegistro", "registro", "maps"}) //Config por padrão para retornar tudo do usuário, adicionar ou tirar com base no necessário
    private User user;

    @Column(name = "data", nullable = false)
    private String data;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "ativo", nullable = false)
    private Integer ativo;

    public UserMap(Integer id, User user, String data, String description, String title, Integer ativo) {
        this.id = id;
        this.user = user;
        this.data = data;
        this.description = description;
        this.title = title;
        this.ativo = ativo;
    }

    public Integer getAtivo() {
        return ativo;
    }

    public void setAtivo(Integer ativo) {
        this.ativo = ativo;
    }

    public UserMap() {

    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser(

    ) {
        return user;
    }


    public void setUser(User user) {
        this.user = user;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
