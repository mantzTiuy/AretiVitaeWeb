package com.av.Av.repository;

import com.av.Av.models.Note;
import com.av.Av.models.UserMap;
import org.aspectj.weaver.ast.Not;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Integer> {
    List<Note> findByUser_Id(Integer userId);
    List<Note> findByUser_Username(String username);
    List<Note> findByUser_IdAndAtivo(Integer userId, int ativo);
    long countByUser_Id(Integer userId);

}
