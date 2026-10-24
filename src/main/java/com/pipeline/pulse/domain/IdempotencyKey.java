package com.pipeline.pulse.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {

    @Id
    @Column(name = "idempotency_key", length = 128, nullable = false)
    private String key;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "status_code", nullable = false)
    private int statusCode;

    @Column(name = "response_body", nullable = false, columnDefinition = "text")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected IdempotencyKey() {
    }

    public IdempotencyKey(String key, String requestHash, int statusCode, String responseBody, Instant createdAt) {
        this.key = key;
        this.requestHash = requestHash;
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.createdAt = createdAt;
    }

    public String getKey() {
        return key;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
