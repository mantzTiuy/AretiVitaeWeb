package com.av.Av.models;

import jakarta.persistence.*;
import jdk.jfr.Unsigned;

@Entity
@Table(name = Note.TABLE_NAME)
public class Note {
    public static final String TABLE_NAME = "AretiVitae_Notes";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", unique = true)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "userid")
    private User user;

    @Column(name = "note")
    private String note;

    @Column(name = "title")
    private String title;

    @Column(name = "ativo")
    private int ativo;


    public Note() {

    }

    public Note(Integer id, User user, String note, String title, int ativo) {
        this.id = id;
        this.user = user;
        this.note = note;
        this.title = title;
        this.ativo = ativo;
    }

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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
