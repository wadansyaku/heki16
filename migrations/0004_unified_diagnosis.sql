-- Keep previous submissions and withdrawal capabilities intact.
CREATE TABLE diagnosis_submissions (
 id TEXT PRIMARY KEY,
 deletion_hash TEXT NOT NULL,
 instrument TEXT NOT NULL,
 consent TEXT NOT NULL,
 mode INTEGER NOT NULL CHECK(mode=40),
 answers TEXT NOT NULL,
 groups_json TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 day TEXT NOT NULL
);
CREATE INDEX diagnosis_created ON diagnosis_submissions(created_at);
CREATE INDEX diagnosis_day_created ON diagnosis_submissions(day,created_at DESC);
CREATE TRIGGER limit_diagnosis BEFORE INSERT ON diagnosis_submissions
WHEN NOT EXISTS(SELECT 1 FROM diagnosis_submissions WHERE id=NEW.id)
BEGIN
 SELECT CASE WHEN COALESCE((SELECT used FROM daily_quota WHERE day=NEW.day),0)>=500 THEN RAISE(ABORT,'daily_limit') END;
END;
CREATE TRIGGER count_diagnosis AFTER INSERT ON diagnosis_submissions
BEGIN
 INSERT INTO daily_quota(day,used) VALUES(NEW.day,1) ON CONFLICT(day) DO UPDATE SET used=used+1;
END;
CREATE TRIGGER revise_diagnosis_insert AFTER INSERT ON diagnosis_submissions BEGIN UPDATE research_state SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revise_diagnosis_delete AFTER DELETE ON diagnosis_submissions BEGIN UPDATE research_state SET revision=revision+1 WHERE id=1; END;
