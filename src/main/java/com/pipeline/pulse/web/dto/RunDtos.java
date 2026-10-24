package com.pipeline.pulse.web.dto;

import com.pipeline.pulse.domain.Note;
import com.pipeline.pulse.domain.Run;
import com.pipeline.pulse.domain.RunStatus;
import com.pipeline.pulse.web.ApiException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class RunDtos {

    private RunDtos() {
    }

    public record CreateRunRequest(
            @Size(max = 64, message = "Use 64 characters or fewer for the id")
            String id,
            @NotBlank(message = "triggeredBy is required")
            @Size(max = 80, message = "Use 80 characters or fewer for who triggered the run")
            String triggeredBy,
            @NotBlank(message = "commitSha is required")
            @Pattern(regexp = "^[0-9a-fA-F]{7,64}$", message = "commitSha must be 7 to 64 hex characters")
            String commitSha
    ) {
    }

    public record UpdateRunRequest(String status) {
    }

    public record NoteResponse(String id, String runId, String author, String body, Instant createdAt) {
        public static NoteResponse from(Note note) {
            return new NoteResponse(note.getId(), note.getRunId(), note.getAuthor(), note.getBody(), note.getCreatedAt());
        }
    }

    public record RunResponse(
            String id,
            String pipelineId,
            String status,
            Instant startedAt,
            Instant finishedAt,
            Long durationMs,
            String triggeredBy,
            String commitSha
    ) {
        public static RunResponse from(Run run) {
            return new RunResponse(
                    run.getId(),
                    run.getPipelineId(),
                    run.getStatus().getValue(),
                    run.getStartedAt(),
                    run.getFinishedAt(),
                    run.getDurationMs(),
                    run.getTriggeredBy(),
                    run.getCommitSha());
        }
    }

    public record RunDetailResponse(
            String id,
            String pipelineId,
            String status,
            Instant startedAt,
            Instant finishedAt,
            Long durationMs,
            String triggeredBy,
            String commitSha,
            List<NoteResponse> notes
    ) {
        public static RunDetailResponse from(Run run) {
            return new RunDetailResponse(
                    run.getId(),
                    run.getPipelineId(),
                    run.getStatus().getValue(),
                    run.getStartedAt(),
                    run.getFinishedAt(),
                    run.getDurationMs(),
                    run.getTriggeredBy(),
                    run.getCommitSha(),
                    run.getNotes().stream().map(NoteResponse::from).toList());
        }
    }

    public record RunPageResponse(List<RunResponse> items, String nextCursor) {
    }

    public record CreateNoteRequest(
            @Size(max = 64, message = "Use 64 characters or fewer for the id")
            String id,
            @NotBlank(message = "Author is required")
            @Size(max = 80, message = "Use 80 characters or fewer for the author")
            String author,
            @NotBlank(message = "Note body is required")
            @Size(max = 2000, message = "Use 2000 characters or fewer for the note")
            String body
    ) {
    }

    public static RunStatus requireStatus(String value) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest("invalid_status", "Status is required.");
        }
        try {
            return RunStatus.fromValue(value);
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest(
                    "invalid_status",
                    "Status must be queued, running, passed, failed, or flaky.");
        }
    }
}
