package com.av.Av.controller;

import com.av.Av.DTO.NoteRequest;
import com.av.Av.Services.NoteService;
import com.av.Av.models.Note;
import com.av.Av.repository.NoteRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.aspectj.weaver.ast.Not;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/apiAvNotes")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    NoteService noteService;

    @GetMapping("/{id}")
    public Note findById(@PathVariable int id){
        return noteService.findById(id);
    }

    @PostMapping(value = "/Register")
    public ResponseEntity<Note> cadastro (@RequestBody NoteRequest request){
       Note newNote = noteService.cadastro(request);

        return ResponseEntity.status(201).body(newNote);
    }

    @GetMapping(value = "/User/{userid}")
    public ResponseEntity<List<Note>> findActiveNotesByUserId (@PathVariable Integer userid){
        return ResponseEntity.ok(noteService.findActiveNotesByUserId(userid));
    }

    @PutMapping(value = "/Update/{id}")
    public ResponseEntity<Note> update(@RequestBody Note updatedNote, @PathVariable Integer id){
       Note note = noteService.update(id, updatedNote);
        return ResponseEntity.ok(note);
    }


}
