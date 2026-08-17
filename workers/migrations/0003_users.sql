CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_username ON users(username);

-- 给 comments 表添加 user_id 字段（关联到用户）
ALTER TABLE comments ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
