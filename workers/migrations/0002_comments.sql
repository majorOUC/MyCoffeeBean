CREATE TABLE comments (
  id          TEXT PRIMARY KEY,
  coffee_id   TEXT NOT NULL REFERENCES coffees(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  author      TEXT NOT NULL DEFAULT '匿名',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_comments_coffee_id ON comments(coffee_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
