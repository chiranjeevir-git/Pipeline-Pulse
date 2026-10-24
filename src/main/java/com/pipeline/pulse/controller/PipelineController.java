package com.pipeline.pulse.controller;

import com.pipeline.pulse.service.IdempotencyService;
import com.pipeline.pulse.service.PipelineService;
import com.pipeline.pulse.service.RunService;
import com.pipeline.pulse.web.dto.PipelineDtos.CreatePipelineRequest;
import com.pipeline.pulse.web.dto.PipelineDtos.PipelineResponse;
import com.pipeline.pulse.web.dto.PipelineDtos.UpdatePipelineRequest;
import com.pipeline.pulse.web.dto.RunDtos.CreateRunRequest;
import com.pipeline.pulse.web.dto.RunDtos.RunPageResponse;
import com.pipeline.pulse.web.dto.RunDtos.RunResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pipelines")
public class PipelineController {

    private final PipelineService pipelines;
    private final RunService runs;
    private final IdempotencyService idempotency;

    public PipelineController(PipelineService pipelines, RunService runs, IdempotencyService idempotency) {
        this.pipelines = pipelines;
        this.runs = runs;
        this.idempotency = idempotency;
    }

    @GetMapping
    public List<PipelineResponse> list() {
        return pipelines.list().stream().map(PipelineResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody CreatePipelineRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        ResponseEntity<String> replay = idempotency.replay(idempotencyKey, request);
        if (replay != null) {
            return replay;
        }
        PipelineResponse created = PipelineResponse.from(pipelines.create(request));
        return idempotency.remember(idempotencyKey, request, 201, created);
    }

    @GetMapping("/{id}")
    public PipelineResponse get(@PathVariable String id) {
        return PipelineResponse.from(pipelines.get(id));
    }

    @PatchMapping("/{id}")
    public PipelineResponse update(@PathVariable String id, @Valid @RequestBody UpdatePipelineRequest request) {
        return PipelineResponse.from(pipelines.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        pipelines.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/runs")
    public RunPageResponse listRuns(
            @PathVariable String id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String cursor) {
        return runs.list(id, status, limit, cursor);
    }

    @PostMapping(value = "/{id}/runs", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RunResponse> createRun(
            @PathVariable String id,
            @Valid @RequestBody CreateRunRequest request) {
        return ResponseEntity.status(201).body(RunResponse.from(runs.create(id, request)));
    }
}
