package com.pipeline.pulse.service;

import com.pipeline.pulse.common.Util;
import com.pipeline.pulse.domain.Note;
import com.pipeline.pulse.domain.Pipeline;
import com.pipeline.pulse.domain.Run;
import com.pipeline.pulse.domain.RunStatus;
import com.pipeline.pulse.repository.NoteRepository;
import com.pipeline.pulse.repository.RunRepository;
import com.pipeline.pulse.web.ApiException;
import com.pipeline.pulse.web.dto.RunDtos;
import com.pipeline.pulse.web.dto.RunDtos.CreateNoteRequest;
import com.pipeline.pulse.web.dto.RunDtos.CreateRunRequest;
import com.pipeline.pulse.web.dto.RunDtos.RunPageResponse;
import com.pipeline.pulse.web.dto.RunDtos.RunResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class RunService {

    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 100;

    // Upper-bound sentinel so the first page (no cursor) needs no null checks in the query.
    private static final Instant CURSOR_TOP_STARTED_AT = Instant.parse("9999-12-31T23:59:59Z");
    private static final String CURSOR_TOP_ID = "\uffff";

    private final PipelineService pipelines;
    private final RunRepository runs;
    private final NoteRepository notes;
    private final RunEventBroker events;

    public RunService(
            PipelineService pipelines,
            RunRepository runs,
            NoteRepository notes,
            RunEventBroker events) {
        this.pipelines = pipelines;
        this.runs = runs;
        this.notes = notes;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public RunPageResponse list(String pipelineId, String statusValue, Integer limit, String cursorValue) {
        pipelines.get(pipelineId);
        RunStatus status = statusValue == null || statusValue.isBlank() ? null : RunDtos.requireStatus(statusValue);
        int size = resolveLimit(limit);
        RunCursor cursor = RunCursor.parse(cursorValue);
        Instant cursorStartedAt = cursor == null ? CURSOR_TOP_STARTED_AT : cursor.startedAt();
        String cursorId = cursor == null ? CURSOR_TOP_ID : cursor.id();

        List<Run> page = status == null
                ? runs.findPage(pipelineId, cursorStartedAt, cursorId, size + 1)
                : runs.findPageByStatus(pipelineId, (short) status.ordinal(), cursorStartedAt, cursorId, size + 1);

        boolean hasMore = page.size() > size;
        List<Run> items = hasMore ? page.subList(0, size) : page;
        String next = hasMore ? RunCursor.encode(items.getLast()) : null;
        return new RunPageResponse(items.stream().map(RunResponse::from).toList(), next);
    }

    @Transactional
    public Run create(String pipelineId, CreateRunRequest request) {
        Pipeline pipeline = pipelines.get(pipelineId);
        String id = Util.trimToNull(request.id());
        if (id != null && runs.existsById(id)) {
            throw ApiException.conflict("run_exists", "A run with this id already exists.");
        }
        Run run = new Run(
                id,
                pipeline,
                RunStatus.QUEUED,
                Instant.now(),
                request.triggeredBy().trim(),
                request.commitSha().trim().toLowerCase());
        return runs.save(run);
    }

    @Transactional(readOnly = true)
    public Run get(String id) {
        Run run = runs.findById(id)
                .orElseThrow(() -> ApiException.notFound("run_not_found", "Run was not found."));
        run.getNotes().size(); // initialize notes within the transaction for the detail view
        return run;
    }

    @Transactional
    public Run updateStatus(String id, RunStatus status) {
        Run run = runs.findById(id)
                .orElseThrow(() -> ApiException.notFound("run_not_found", "Run was not found."));
        run.applyStatus(status, Instant.now());
        events.publish(run);
        return get(id);
    }

    @Transactional
    public Note addNote(String runId, CreateNoteRequest request) {
        Run run = runs.findById(runId)
                .orElseThrow(() -> ApiException.notFound("run_not_found", "Run was not found."));
        String id = Util.trimToNull(request.id());
        if (id != null && notes.existsById(id)) {
            throw ApiException.conflict("note_exists", "A note with this id already exists.");
        }
        Note note = new Note(id, run, request.author().trim(), request.body().trim(), Instant.now());
        return notes.save(note);
    }

    @Transactional
    public void deleteNote(String noteId) {
        Note note = notes.findById(noteId)
                .orElseThrow(() -> ApiException.notFound("note_not_found", "Note was not found."));
        notes.delete(note);
    }

    public RunEventBroker events() {
        return events;
    }

    private static int resolveLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw ApiException.badRequest("invalid_limit", "limit must be between 1 and " + MAX_LIMIT + ".");
        }
        return limit;
    }
}
