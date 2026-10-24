package com.pipeline.pulse.service;

import com.pipeline.pulse.domain.Run;
import com.pipeline.pulse.web.ApiException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

public record RunCursor(Instant startedAt, String id) {

    public static RunCursor parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(raw), StandardCharsets.UTF_8);
            int sep = decoded.indexOf('|');
            if (sep < 1) {
                throw new IllegalArgumentException("missing separator");
            }
            return new RunCursor(Instant.parse(decoded.substring(0, sep)), decoded.substring(sep + 1));
        } catch (RuntimeException ex) {
            throw ApiException.badRequest("invalid_cursor", "Cursor is not a valid page token.");
        }
    }

    public static String encode(Run run) {
        String raw = run.getStartedAt() + "|" + run.getId();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}
