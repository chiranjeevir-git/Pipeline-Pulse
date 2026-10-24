package com.pipeline.pulse.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ProductConverter implements AttributeConverter<Product, Short> {

    @Override
    public Short convertToDatabaseColumn(Product attribute) {
        return attribute == null ? null : (short) attribute.ordinal();
    }

    @Override
    public Product convertToEntityAttribute(Short dbData) {
        if (dbData == null) {
            return null;
        }
        Product[] values = Product.values();
        if (dbData < 0 || dbData >= values.length) {
            throw new IllegalArgumentException("Unknown product ordinal: " + dbData);
        }
        return values[dbData];
    }
}
