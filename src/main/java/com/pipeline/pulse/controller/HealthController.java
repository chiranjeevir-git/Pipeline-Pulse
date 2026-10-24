package com.pipeline.pulse.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        try {
            Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (one != null && one == 1) {
                return ResponseEntity.ok(Map.of("status", "ok", "db", "ok"));
            }
            return ResponseEntity.status(503).body(Map.of("status", "error", "db", "error"));
        } catch (Exception ex) {
            return ResponseEntity.status(503).body(Map.of("status", "error", "db", "error"));
        }
    }
}
