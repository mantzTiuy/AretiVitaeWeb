package com.av.Av.DTO;

public class UserMapRequest {
    private Long userId;
    private String data;
    private String title;
    private String description;
    private int ativo;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getAtivo() { return ativo; }
    public void setAtivo(int ativo) { this.ativo = ativo; }


}
