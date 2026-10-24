package com.pipeline.pulse.repository;

import com.pipeline.pulse.domain.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineRepository extends JpaRepository<Pipeline, String> {

    List<Pipeline> findAllByOrderByCreatedAtDesc();
}
