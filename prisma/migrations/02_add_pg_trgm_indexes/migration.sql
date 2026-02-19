-- -- CreateIndex for pg_trgm full-text search on Fields.name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_fields_name_trgm ON infrastructure."Fields" USING gin (name gin_trgm_ops);

