package com.pipeline.pulse.web.dto;

import com.pipeline.pulse.domain.Pipeline;
import com.pipeline.pulse.domain.Product;
import com.pipeline.pulse.web.ApiException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class PipelineDtos {

    private PipelineDtos() {
    }

    public record CreatePipelineRequest(
            @Size(max = 64, message = "Use 64 characters or fewer for the id")
            String id,
            @NotBlank(message = "Name is required")
            String name,
            String product
    ) {
    }

    public record UpdatePipelineRequest(
            @NotBlank(message = "Name is required")
            String name,
            String product
    ) {
    }

    public record PipelineResponse(String id, String name, String product, Instant createdAt) {
        public static PipelineResponse from(Pipeline pipeline) {
            return new PipelineResponse(
                    pipeline.getId(),
                    pipeline.getName(),
                    pipeline.getProduct().getValue(),
                    pipeline.getCreatedAt());
        }
    }

    public static Product requireProduct(String value) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest("invalid_product", "Product is required.");
        }
        try {
            return Product.fromValue(value);
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest(
                    "invalid_product",
                    "Product must be flasharray, flashblade, or hyperscale.");
        }
    }
}
