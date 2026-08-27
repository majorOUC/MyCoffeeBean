-- 手冲参数展示卡（单行配置表，始终只有一行，id 固定为 'default'）
CREATE TABLE brew_card (
  id           TEXT PRIMARY KEY,
  bean_name    TEXT NOT NULL DEFAULT '',
  dose         TEXT NOT NULL DEFAULT '',
  water        TEXT NOT NULL DEFAULT '',
  ratio        TEXT NOT NULL DEFAULT '',
  temperature  TEXT NOT NULL DEFAULT '',
  grind_size   TEXT NOT NULL DEFAULT '',
  bloom_time   TEXT NOT NULL DEFAULT '',
  bloom_water  TEXT NOT NULL DEFAULT '',
  stage1_water TEXT NOT NULL DEFAULT '',
  stage2_water TEXT NOT NULL DEFAULT '',
  stage3_water TEXT NOT NULL DEFAULT '',
  image_url    TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
