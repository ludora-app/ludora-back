-- CreateIndex for pg_trgm full-text search on Fields.name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_fields_name_trgm ON infrastructure."Fields" USING gin (name gin_trgm_ops);

-- CreateIndex for pg_trgm full-text search on Users.firstname and Users.lastname
CREATE INDEX idx_users_firstname_trgm ON auth."Users" USING gin (firstname gin_trgm_ops);
CREATE INDEX idx_users_lastname_trgm ON auth."Users" USING gin (lastname gin_trgm_ops);

-- CreateIndex for pg_trgm full-text search on Sessions.title
CREATE INDEX idx_sessions_title_trgm ON sessions."Sessions" USING gin (title gin_trgm_ops);