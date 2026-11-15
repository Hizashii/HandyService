CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_reset_at ON auth_rate_limits(reset_at);
