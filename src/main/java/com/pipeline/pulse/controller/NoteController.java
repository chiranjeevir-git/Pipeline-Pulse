package com.pipeline.pulse.controller;

import com.pipeline.pulse.service.RunService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notes")
public class NoteController {

    private final RunService runs;

    public NoteController(RunService runs) {
        this.runs = runs;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        runs.deleteNote(id);
        return ResponseEntity.noContent().build();
    }
}
