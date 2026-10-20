-- Visits are tab sessions. No account, answer, URL, IP or device identifier is retained.
CREATE TABLE nocturne_metric_events(
 session TEXT NOT NULL, event TEXT NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(session,event)
);
CREATE INDEX nocturne_metric_expiry ON nocturne_metric_events(created_at);
CREATE TABLE nocturne_metric_daily(
 day TEXT NOT NULL, event TEXT NOT NULL, device TEXT NOT NULL, source TEXT NOT NULL,
 n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,event,device,source)
);
CREATE TABLE nocturne_metric_quota(day TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
CREATE TABLE nocturne_metric_state(id INTEGER PRIMARY KEY CHECK(id=1), started_at INTEGER NOT NULL);
INSERT INTO nocturne_metric_state VALUES(1,CAST(unixepoch('now')*1000 AS INTEGER));
CREATE TRIGGER nocturne_metric_cap BEFORE INSERT ON nocturne_metric_events
WHEN NOT EXISTS(SELECT 1 FROM nocturne_metric_events WHERE session=NEW.session AND event=NEW.event)
BEGIN
 SELECT CASE WHEN COALESCE((SELECT n FROM nocturne_metric_quota WHERE day=date('now')),0)>=20000 THEN RAISE(ABORT,'metric_capacity') END;
 INSERT INTO nocturne_metric_quota(day,n) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET n=n+1;
END;
CREATE INDEX nocturne_record_analysis ON nocturne_records(instrument,consent,created_at);
