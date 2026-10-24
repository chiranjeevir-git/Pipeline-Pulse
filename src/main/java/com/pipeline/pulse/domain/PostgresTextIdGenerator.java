package com.pipeline.pulse.domain;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;
import org.hibernate.generator.GeneratorCreationContext;

import java.lang.reflect.Member;
import java.util.EnumSet;

/**
 * Uses the client-supplied identifier when one is set, otherwise asks PostgreSQL for a
 * {@code gen_random_uuid()} rendered as text. The value is then inserted as a normal
 * varchar/text id.
 */
public class PostgresTextIdGenerator implements BeforeExecutionGenerator {

    private static final String GENERATE_SQL = "select gen_random_uuid()::text";

    public PostgresTextIdGenerator(
            PostgresTextId config,
            Member annotatedMember,
            GeneratorCreationContext context) {
        // No configuration needed.
    }

    @Override
    public EnumSet<EventType> getEventTypes() {
        return EnumSet.of(EventType.INSERT);
    }

    @Override
    public Object generate(
            SharedSessionContractImplementor session,
            Object owner,
            Object currentValue,
            EventType eventType) {
        if (currentValue instanceof String supplied && !supplied.isBlank()) {
            return supplied;
        }
        return session.doReturningWork(connection -> {
            try (var statement = connection.prepareStatement(GENERATE_SQL);
                 var resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getString(1);
            }
        });
    }
}
