package com.pipeline.pulse.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pipelines")
public class Pipeline {

    @Id
    @PostgresTextId
    @Column(length = 64, nullable = false)
    private String id;

    @Column(nullable = false, length = 80)
    private String name;

    @Convert(converter = ProductConverter.class)
    @Column(nullable = false)
    private Product product;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "pipeline", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startedAt DESC, id DESC")
    private List<Run> runs = new ArrayList<>();

    protected Pipeline() {
    }

    public Pipeline(String id, String name, Product product, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.product = product;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<Run> getRuns() {
        return runs;
    }
}
