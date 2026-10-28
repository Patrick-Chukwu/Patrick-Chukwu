-- Server-side admin sessions. Only a SHA-256 hash of the cookie token is stored,
-- so a database read does not reveal usable session cookies.
CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  password_fingerprint TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Login throttling that survives serverless cold starts and multiple instances.
CREATE TABLE login_attempts (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

-- Logo files live in the database because serverless hosts have no durable disk.
CREATE TABLE document_assets (
  key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL
);
