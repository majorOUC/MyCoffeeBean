-- 日记配图：JSON 数组字符串，元素为 /api/images/<key> 形式的 URL（最多 9 张）
ALTER TABLE diary ADD COLUMN images TEXT NOT NULL DEFAULT '[]';
