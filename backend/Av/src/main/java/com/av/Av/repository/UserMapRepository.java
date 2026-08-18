package com.av.Av.repository;

import com.av.Av.models.User;
import com.av.Av.models.UserMap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserMapRepository extends JpaRepository<UserMap, Integer> {
    List<UserMap> findByUser_Id(Integer userId);
    List<UserMap> findByUser_Username(String username);
    List<UserMap> findByUser_IdAndAtivo(Integer userId, int ativo);
    List<UserMap> findByUser_UsernameAndAtivo(String username, int ativo);
    long countByUser_Id(Integer userId);
}
