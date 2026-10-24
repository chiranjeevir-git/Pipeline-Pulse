package com.pipeline.pulse.domain;

import com.fasterxml.jackson.annotation.JsonValue;

public enum RunStatus {
    QUEUED("queued"),
    RUNNING("running"),
    PASSED("passed"),
    FAILED("failed"),
    FLAKY("flaky");

    private final String value;

    RunStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public boolean isTerminal() {
        return this == PASSED || this == FAILED || this == FLAKY;
    }

    public static RunStatus fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (RunStatus status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown status: " + value);
    }
}
