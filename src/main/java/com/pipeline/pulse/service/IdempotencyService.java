package com.pipeline.pulse.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.pipeline.pulse.domain.IdempotencyKey;
import com.pipeline.pulse.repository.IdempotencyKeyRepository;
import com.pipeline.pulse.web.ApiException;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository repository;
    private final ObjectMapper objectMapper;

    public IdempotencyService(IdempotencyKeyRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public <T> ResponseEntity<T> remember(String key, Object request, int status, T body) {
        if (key == null || key.isBlank()) {
            return ResponseEntity.status(status).body(body);
        }
        String hash = hash(request);
        repository.findById(key).ifPresent(existing -> {
            if (!existing.getRequestHash().equals(hash)) {
                throw ApiException.conflict(
                        "idempotency_conflict",
                        "Idempotency-Key was already used with a different body.");
            }
        });
        if (repository.findById(key).isEmpty()) {
            repository.save(new IdempotencyKey(key, hash, status, write(body), Instant.now()));
        }
        return ResponseEntity.status(status).body(body);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<String> replay(String key, Object request) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return repository.findById(key).map(existing -> {
            String hash = hash(request);
            if (!existing.getRequestHash().equals(hash)) {
                throw ApiException.conflict(
                        "idempotency_conflict",
                        "Idempotency-Key was already used with a different body.");
            }
            return ResponseEntity.status(existing.getStatusCode())
                    .header("Content-Type", "application/json")
                    .body(existing.getResponseBody());
        }).orElse(null);
    }

    private String hash(Object request) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(objectMapper.writeValueAsBytes(request));
            return HexFormat.of().formatHex(digest);
        } catch (JacksonException | NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Could not hash idempotent request", ex);
        }
    }

    private String write(Object body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Could not store idempotent response", ex);
        }
    }
}
