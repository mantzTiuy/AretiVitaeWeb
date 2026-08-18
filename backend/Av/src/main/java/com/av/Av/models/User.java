package com.av.Av.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.antlr.v4.runtime.misc.NotNull;

import java.util.List;
import java.util.Objects;

@Entity
@Table(name = User.TABLE_NAME)
public class User {
    public static final String TABLE_NAME = "AretiVitae_Usuario";
    public interface CreateUser{}
    public interface UpdateUser{}



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", unique = true)
    private Integer id;

    @Column(name = "username", length = 16, nullable = false, unique = true)
    private String username;

    @Column(name = "idade")
    private int idade;

    @Column(name = "email")
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "senha", nullable = false)
    private String senha;

    @Column(name = "ativo")
    private int ativo;

    @Column(name = "tipoRegistro")
    private String tipoRegistro;

    @Column(name = "registro")
    private String registro;

    /*--CONSTRUTORES--*/

    @JsonIgnore
    @OneToMany(mappedBy = "user")//Atributo user da class UserMap
    private List<UserMap> maps;

    @JsonIgnore
    @OneToMany(mappedBy = "user")//Atributo user da class Compra
    private List<Compra> compras;

    public User(){

    }

    public User(Integer id, String username, int idade, String email, String senha,  int ativo) {
        this.id = id;
        this.username = username;
        this.idade = idade;
        this.email = email;
        this.senha = senha;
        this.ativo = ativo;
    }

    /*--Get & Set--*/

    public int getAtivo() {
        return ativo;
    }

    public void setAtivo(int ativo) {
        this.ativo = ativo;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public int getIdade() {
        return idade;
    }

    public void setIdade(int idade) {
        this.idade = idade;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }


    public String getTipoRegistro() {
        return tipoRegistro;
    }

    public void setTipoRegistro(String tipoRegistro) {
        this.tipoRegistro = tipoRegistro;
    }

    public String getRegistro() {
        return registro;
    }

    public void setRegistro(String registro) {
        this.registro = registro;
    }

    public List<UserMap> getMaps() {
        return maps;
    }

    public void setMaps(List<UserMap> maps) {
        this.maps = maps;
    }

    public List<Compra> getCompras() {
        return compras;
    }

    public void setCompras(List<Compra> compras) {
        this.compras = compras;
    }

    /*Gerado pelo INTELIJ*/


    /*Feito na mão*/
    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((this.id == null) ? 0 : this.id.hashCode());
        return result;
    }
}