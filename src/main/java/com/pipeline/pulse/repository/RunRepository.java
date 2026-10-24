package com.pipeline.pulse.repository;

import com.pipeline.pulse.domain.Run;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface RunRepository extends JpaRepository<Run, String> {

    @Query(value = """
            SELECT * FROM runs
            WHERE pipeline_id = :pipelineId
              AND (started_at < :cursorStartedAt
                   OR (started_at = :cursorStartedAt AND id < :cursorId))
            ORDER BY started_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Run> findPage(
            @Param("pipelineId") String pipelineId,
            @Param("cursorStartedAt") Instant cursorStartedAt,
            @Param("cursorId") String cursorId,
            @Param("limit") int limit);

    @Query(value = """
            SELECT * FROM runs
            WHERE pipeline_id = :pipelineId
              AND status = :status
              AND (started_at < :cursorStartedAt
                   OR (started_at = :cursorStartedAt AND id < :cursorId))
            ORDER BY started_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Run> findPageByStatus(
            @Param("pipelineId") String pipelineId,
            @Param("status") short status,
            @Param("cursorStartedAt") Instant cursorStartedAt,
            @Param("cursorId") String cursorId,
            @Param("limit") int limit);
}
