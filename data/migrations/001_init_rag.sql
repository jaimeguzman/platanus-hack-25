CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS memory_edge;
DROP TABLE IF EXISTS memory;

CREATE TABLE memory (
    id          SERIAL PRIMARY KEY,
    text        TEXT NOT NULL,
    embedding   VECTOR(1536), -- text-embedding-3-small
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_id ON memory (id);
CREATE INDEX idx_memory_created_at ON memory (created_at);

CREATE INDEX idx_memory_embedding_cosine
ON memory
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE TABLE memory_edge (
    source_id   INTEGER NOT NULL,
    target_id   INTEGER NOT NULL,
    weight      DOUBLE PRECISION NOT NULL,

    CONSTRAINT pk_memory_edge PRIMARY KEY (source_id, target_id),
    CONSTRAINT fk_memory_edge_source
        FOREIGN KEY (source_id) REFERENCES memory (id) ON DELETE CASCADE,
    CONSTRAINT fk_memory_edge_target
        FOREIGN KEY (target_id) REFERENCES memory (id) ON DELETE CASCADE
);

CREATE INDEX idx_memory_edge_source ON memory_edge (source_id);
CREATE INDEX idx_memory_edge_target ON memory_edge (target_id);
CREATE INDEX idx_memory_edge_weight ON memory_edge (weight DESC);
