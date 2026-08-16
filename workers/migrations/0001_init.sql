-- Coffee Atlas 初始表结构
-- id 由 Worker 侧生成（crypto.randomUUID()），D1 只存 TEXT 主键
-- flavor_notes 以 JSON 数组文本存储（个人项目规模下比关联表更实用）

CREATE TABLE coffees (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  roaster     TEXT NOT NULL,
  country     TEXT NOT NULL,
  region      TEXT NOT NULL DEFAULT '',
  farm        TEXT,
  variety     TEXT,
  process     TEXT NOT NULL,
  altitude    INTEGER,
  roast_level TEXT NOT NULL,
  flavor_notes TEXT NOT NULL DEFAULT '[]',
  rating      REAL NOT NULL DEFAULT 0,
  description TEXT,
  image_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_coffees_country    ON coffees(country);
CREATE INDEX idx_coffees_process    ON coffees(process);
CREATE INDEX idx_coffees_roast      ON coffees(roast_level);
CREATE INDEX idx_coffees_created_at ON coffees(created_at DESC);

CREATE TABLE tastings (
  id          TEXT PRIMARY KEY,
  coffee_id   TEXT NOT NULL REFERENCES coffees(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  brew_method TEXT NOT NULL,
  dose        REAL,
  water       REAL,
  temperature REAL,
  grind_size  TEXT,
  brew_time   TEXT,
  rating      REAL NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tastings_coffee_id ON tastings(coffee_id);
CREATE INDEX idx_tastings_date      ON tastings(date DESC);
