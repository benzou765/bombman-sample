CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS mydb.user (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(20), icon VARCHAR(30), room_id INT NOT NULL, PRIMARY KEY(`id`)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS mydb.chat_log (id INT UNSIGNED NOT NULL AUTO_INCREMENT, room_id INT NOT NULL, user_id INT NOT NULL, message TEXT, PRIMARY KEY(`id`)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE mydb.user ADD INDEX room_idx(room_id);
ALTER TABLE mydb.chat_log ADD INDEX user_idx(user_id);
ALTER TABLE mydb.chat_log ADD INDEX room_idx(room_id);