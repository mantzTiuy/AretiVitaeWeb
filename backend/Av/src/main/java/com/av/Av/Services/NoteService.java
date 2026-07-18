package com.av.Av.Services;

import com.av.Av.DTO.NoteRequest;
import com.av.Av.models.Note;
import com.av.Av.models.User;
import com.av.Av.repository.NoteRepository;
import com.av.Av.repository.UserRepository;
import org.aspectj.weaver.ast.Not;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    public Note findById(int id){
        return noteRepository.findById(id).orElseThrow(() -> new RuntimeException("NOTE NAO ENCONTRADA"));
    }

    public Note cadastro(NoteRequest request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("DIGITE ALGUM ID");
        }

        User user = userRepository.findById(request.getUserId().intValue())
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));

        Note note = new Note();
        note.setUser(user);
        note.setNote(request.getNote());
        note.setTitle(request.getTitle());

        return noteRepository.save(note);
    }
    public List<Note> findActiveNotesByUserId(Integer userid){
        userRepository.findById(userid)
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));

        return noteRepository.findByUser_IdAndAtivo(userid, 0);
    }

    public Note update(int id, Note updatedNote){
        Note existingNote = noteRepository.findById((int) id).orElseThrow(() -> new RuntimeException("ID DE NOTA NAO ENCONTRADO"));
        if(updatedNote.getTitle() != null){
            existingNote.setTitle(updatedNote.getTitle());
        }
        if(updatedNote.getNote() != null){
            existingNote.setNote(updatedNote.getNote());
        }
        int ativo = updatedNote.getAtivo();
        if (ativo != 0 && ativo != 1) {
            throw new IllegalArgumentException("ATIVO - 0 / DESATIVO - 1");
        }

        existingNote.setAtivo(ativo);

        return noteRepository.save(existingNote);
    }



}
