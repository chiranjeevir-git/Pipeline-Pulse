package com.pipeline.pulse.domain;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Product {
    FLASHARRAY("flasharray"),
    FLASHBLADE("flashblade"),
    HYPERSCALE("hyperscale");

    private final String value;

    Product(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public static Product fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (Product product : values()) {
            if (product.value.equals(value)) {
                return product;
            }
        }
        throw new IllegalArgumentException("Unknown product: " + value);
    }
}
