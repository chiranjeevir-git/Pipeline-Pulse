package com.pipeline.pulse.service;

import com.pipeline.pulse.common.Util;
import com.pipeline.pulse.domain.Pipeline;
import com.pipeline.pulse.domain.Product;
import com.pipeline.pulse.repository.PipelineRepository;
import com.pipeline.pulse.web.ApiException;
import com.pipeline.pulse.web.dto.PipelineDtos;
import com.pipeline.pulse.web.dto.PipelineDtos.CreatePipelineRequest;
import com.pipeline.pulse.web.dto.PipelineDtos.UpdatePipelineRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class PipelineService {

    private final PipelineRepository pipelines;

    public PipelineService(PipelineRepository pipelines) {
        this.pipelines = pipelines;
    }

    @Transactional(readOnly = true)
    public List<Pipeline> list() {
        return pipelines.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Pipeline get(String id) {
        return pipelines.findById(id)
                .orElseThrow(() -> ApiException.notFound("pipeline_not_found", "Pipeline was not found."));
    }

    @Transactional
    public Pipeline create(CreatePipelineRequest request) {
        Product product = PipelineDtos.requireProduct(request.product());
        String id = Util.trimToNull(request.id());
        if (id != null && pipelines.existsById(id)) {
            throw ApiException.conflict("pipeline_exists", "A pipeline with this id already exists.");
        }
        Pipeline pipeline = new Pipeline(id, request.name().trim(), product, Instant.now());
        return pipelines.save(pipeline);
    }

    @Transactional
    public Pipeline update(String id, UpdatePipelineRequest request) {
        Pipeline pipeline = get(id);
        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw ApiException.badRequest("invalid_name", "Name is required.");
            }
            pipeline.setName(name);
        }
        if (request.product() != null) {
            pipeline.setProduct(PipelineDtos.requireProduct(request.product()));
        }
        return pipeline;
    }

    @Transactional
    public void delete(String id) {
        Pipeline pipeline = get(id);
        pipelines.delete(pipeline);
    }
}
