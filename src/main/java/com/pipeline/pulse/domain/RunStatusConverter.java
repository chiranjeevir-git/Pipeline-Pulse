package com.pipeline.pulse.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RunStatusConverter implements AttributeConverter<RunStatus, Short> {

    @Override
    public Short convertToDatabaseColumn(RunStatus attribute) {
        return attribute == null ? null : (short) attribute.ordinal();
    }

    @Override
    public RunStatus convertToEntityAttribute(Short dbData) {
        if (dbData == null) {
            return null;
        }
        RunStatus[] values = RunStatus.values();
        if (dbData < 0 || dbData >= values.length) {
            throw new IllegalArgumentException("Unknown status ordinal: " + dbData);
        }
        return values[dbData];
    }
}
