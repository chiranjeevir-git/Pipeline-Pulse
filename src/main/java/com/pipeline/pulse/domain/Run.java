package com.pipeline.pulse.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "runs")
public class Run {

    @Id
    @PostgresTextId
    @Column(length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @Convert(converter = RunStatusConverter.class)
    @Column(nullable = false)
    private RunStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "triggered_by", nullable = false, length = 80)
    private String triggeredBy;

    @Column(name = "commit_sha", nullable = false, length = 64)
    private String commitSha;

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC, id ASC")
    private List<Note> notes = new ArrayList<>();

    protected Run() {
    }

    public Run(String id, Pipeline pipeline, RunStatus status, Instant startedAt, String triggeredBy, String commitSha) {
        this.id = id;
        this.pipeline = pipeline;
        this.status = status;
        this.startedAt = startedAt;
        this.triggeredBy = triggeredBy;
        this.commitSha = commitSha;
    }

    public void applyStatus(RunStatus next, Instant now) {
        this.status = next;
        if (next.isTerminal()) {
            this.finishedAt = now;
            this.durationMs = Math.max(0, Duration.between(startedAt, now).toMillis());
        } else {
            this.finishedAt = null;
            this.durationMs = null;
        }
    }

    public String getId() {
        return id;
    }

    public Pipeline getPipeline() {
        return pipeline;
    }

    public String getPipelineId() {
        return pipeline.getId();
    }

    public RunStatus getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public String getTriggeredBy() {
        return triggeredBy;
    }

    public String getCommitSha() {
        return commitSha;
    }

    public List<Note> getNotes() {
        return notes;
    }
}
