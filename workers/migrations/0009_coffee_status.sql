-- 删除从未启用的冲煮记录表（代码零引用）
DROP TABLE IF EXISTS tastings;

-- 豆子状态：want=想喝 / drinking=在喝 / finished=喝完（存量豆子视为已喝完）
ALTER TABLE coffees ADD COLUMN status TEXT NOT NULL DEFAULT 'finished';

CREATE INDEX idx_coffees_status ON coffees(status);
