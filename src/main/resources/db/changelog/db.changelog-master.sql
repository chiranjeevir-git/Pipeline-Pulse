--liquibase formatted sql

--changeset pipeline-pulse:001-create-pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id         VARCHAR(64)  NOT NULL DEFAULT (gen_random_uuid())::text,
    name       VARCHAR(80)  NOT NULL,
    product    SMALLINT     NOT NULL,
    created_at TIMESTAMP    NOT NULL,
    CONSTRAINT pk_pipelines PRIMARY KEY (id),
    CONSTRAINT chk_pipelines_product CHECK (product BETWEEN 0 AND 2)
);
--rollback DROP TABLE pipelines;

--changeset pipeline-pulse:002-create-runs
CREATE TABLE IF NOT EXISTS runs (
    id           VARCHAR(64) NOT NULL DEFAULT (gen_random_uuid())::text,
    pipeline_id  VARCHAR(64) NOT NULL,
    status       SMALLINT    NOT NULL,
    started_at   TIMESTAMP   NOT NULL,
    finished_at  TIMESTAMP,
    duration_ms  BIGINT,
    triggered_by VARCHAR(80) NOT NULL,
    commit_sha   VARCHAR(64) NOT NULL,
    CONSTRAINT pk_runs PRIMARY KEY (id),
    CONSTRAINT fk_runs_pipeline FOREIGN KEY (pipeline_id) REFERENCES pipelines (id) ON DELETE CASCADE,
    CONSTRAINT chk_runs_status CHECK (status BETWEEN 0 AND 4)
);
CREATE INDEX IF NOT EXISTS idx_runs_pipeline_started ON runs (pipeline_id, started_at DESC, id DESC);
--rollback DROP TABLE runs;

--changeset pipeline-pulse:003-create-notes
CREATE TABLE IF NOT EXISTS notes (
    id         VARCHAR(64)   NOT NULL DEFAULT (gen_random_uuid())::text,
    run_id     VARCHAR(64)   NOT NULL,
    author     VARCHAR(80)   NOT NULL,
    body       VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP     NOT NULL,
    CONSTRAINT pk_notes PRIMARY KEY (id),
    CONSTRAINT fk_notes_run FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notes_run ON notes (run_id);
--rollback DROP TABLE notes;

--changeset pipeline-pulse:004-create-idempotency-keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash    VARCHAR(64)  NOT NULL,
    status_code     INT          NOT NULL,
    response_body   TEXT         NOT NULL,
    created_at      TIMESTAMP    NOT NULL,
    CONSTRAINT pk_idempotency_keys PRIMARY KEY (idempotency_key)
);
--rollback DROP TABLE idempotency_keys;
