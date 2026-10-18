CREATE TABLE submissions (
 id TEXT PRIMARY KEY,
 deletion_hash TEXT NOT NULL,
 instrument TEXT NOT NULL,
 consent TEXT NOT NULL,
 mode INTEGER NOT NULL CHECK(mode IN (18,32)),
 answers TEXT NOT NULL,
 groups_json TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 day TEXT NOT NULL
);
CREATE INDEX submissions_created ON submissions(created_at);
CREATE INDEX submissions_day ON submissions(day);
CREATE TABLE daily_quota (day TEXT PRIMARY KEY, used INTEGER NOT NULL DEFAULT 0);
CREATE TRIGGER limit_submissions BEFORE INSERT ON submissions
WHEN NOT EXISTS(SELECT 1 FROM submissions WHERE id=NEW.id)
BEGIN
 SELECT CASE WHEN COALESCE((SELECT used FROM daily_quota WHERE day=NEW.day),0)>=500 THEN RAISE(ABORT,'daily_limit') END;
END;
CREATE TRIGGER count_submissions AFTER INSERT ON submissions
BEGIN
 INSERT INTO daily_quota(day,used) VALUES(NEW.day,1) ON CONFLICT(day) DO UPDATE SET used=used+1;
END;
CREATE TABLE maintenance (day TEXT PRIMARY KEY, status TEXT NOT NULL, checked_at INTEGER NOT NULL);
