-- 删除旧的 CHECK 约束，添加新的包含 'publisher'
CREATE TABLE users_new (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'publisher', 'user')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new SELECT * FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX idx_users_username ON users(username);
