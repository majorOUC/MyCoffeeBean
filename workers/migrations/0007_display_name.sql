-- 添加显示名（昵称）字段，账号字段用于登录，显示名用于展示
ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
