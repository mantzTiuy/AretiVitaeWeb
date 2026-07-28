package com.av.Av.repository;

import com.av.Av.models.Compra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CompraRepository extends JpaRepository<Compra, Integer> {
    List<Compra> findByUser_Id(Integer userId);
    List<Compra> findByUser_Username(String username);
    List<Compra> findByUser_IdAndAtivo(Integer userId, int ativo);
    List<Compra> findByUser_IdAndPlanoAndAtivo(Integer userId, Integer plano, int ativo);

    Optional<Compra> findByTxid(String txid);
    boolean existsByTxid(String txid);

    List<Compra> findByAtivoAndDayVencimentoBefore(int ativo, LocalDate dayVencimento);
    List<Compra> findByAtivoAndCriadoEmBefore(int ativo, LocalDateTime criadoEm);
    List<Compra> findByAtivoAndDayVencimentoBefore(Integer ativo, LocalDate data);
}