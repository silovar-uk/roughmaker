CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY,
 owner_email TEXT NOT NULL,
 title TEXT NOT NULL,
 content_json TEXT NOT NULL,
 rev INTEGER NOT NULL DEFAULT 1,
 deleted_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_owner_updated ON projects(owner_email,updated_at DESC);
CREATE TABLE IF NOT EXISTS snapshots (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id),
 rev INTEGER NOT NULL,
 note TEXT NOT NULL DEFAULT '',
 content_json TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(project_id,rev)
);
