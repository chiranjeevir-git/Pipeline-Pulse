package com.pipeline.pulse.common;

public final class Util {

    private Util() {
    }

    /**
     * Returns the trimmed value, or {@code null} when the input is {@code null} or blank.
     * A {@code null} id lets PostgreSQL generate one during insert.
     */
    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
