package com.av.Av.Services;

import com.av.Av.DTO.NoteRequest;
import com.av.Av.models.Note;
import com.av.Av.models.User;
import com.av.Av.repository.NoteRepository;
import com.av.Av.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NoteService {

    private static final int PLANO_BUILDER = 4;
    private static final int LIMITE_NOTAS = 100;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompraService compraService;

    public Note findById(int id){
        return noteRepository.findById(id).orElseThrow(() -> new RuntimeException("NOTE NAO ENCONTRADA"));
    }

    public Note cadastro(NoteRequest request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("DIGITE ALGUM ID");
        }

        Integer userId = request.getUserId().intValue();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));

        Map<String, Object> status = compraService.statusAtivo(userId);
        Integer plano = Boolean.TRUE.equals(status.get("temAcesso")) ? (Integer) status.get("plano") : 0;

        if (plano != PLANO_BUILDER) {
            long totalNotas = noteRepository.countByUser_Id(userId);
            if (totalNotas >= LIMITE_NOTAS) {
                throw new RuntimeException("Voce atingiu o limite de " + LIMITE_NOTAS + " notas");
            }
        }

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