CREATE TABLE IF NOT EXISTS last_stop_rooms (
  code text PRIMARY KEY,
  creation_key text UNIQUE NOT NULL,
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT clock_timestamp() + interval '24 hours'
);
CREATE INDEX IF NOT EXISTS last_stop_rooms_expiry ON last_stop_rooms (expires_at);
CREATE TABLE IF NOT EXISTS last_stop_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  window_start timestamptz NOT NULL DEFAULT clock_timestamp()
);
