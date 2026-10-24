package com.pipeline.pulse.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @PostgresTextId
    @Column(length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private Run run;

    @Column(nullable = false, length = 80)
    private String author;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Note() {
    }

    public Note(String id, Run run, String author, String body, Instant createdAt) {
        this.id = id;
        this.run = run;
        this.author = author;
        this.body = body;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public Run getRun() {
        return run;
    }

    public String getRunId() {
        return run.getId();
    }

    public String getAuthor() {
        return author;
    }

    public String getBody() {
        return body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
