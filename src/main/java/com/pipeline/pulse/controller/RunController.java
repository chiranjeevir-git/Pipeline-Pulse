package com.pipeline.pulse.controller;

import com.pipeline.pulse.service.RunService;
import com.pipeline.pulse.web.dto.RunDtos;
import com.pipeline.pulse.web.dto.RunDtos.CreateNoteRequest;
import com.pipeline.pulse.web.dto.RunDtos.NoteResponse;
import com.pipeline.pulse.web.dto.RunDtos.RunDetailResponse;
import com.pipeline.pulse.web.dto.RunDtos.UpdateRunRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/runs")
public class RunController {

    private final RunService runs;

    public RunController(RunService runs) {
        this.runs = runs;
    }

    @GetMapping("/{id}")
    public RunDetailResponse get(@PathVariable String id) {
        return RunDetailResponse.from(runs.get(id));
    }

    @PatchMapping("/{id}")
    public RunDetailResponse update(@PathVariable String id, @Valid @RequestBody UpdateRunRequest request) {
        return RunDetailResponse.from(runs.updateStatus(id, RunDtos.requireStatus(request.status())));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<NoteResponse> addNote(
            @PathVariable String id,
            @Valid @RequestBody CreateNoteRequest request) {
        return ResponseEntity.status(201).body(NoteResponse.from(runs.addNote(id, request)));
    }

    @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(@PathVariable String id) {
        runs.get(id);
        return runs.events().subscribe(id);
    }
}
