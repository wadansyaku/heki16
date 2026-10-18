PRAGMA foreign_keys=ON;
CREATE TABLE nocturne_quota(day TEXT PRIMARY KEY, writes INTEGER NOT NULL DEFAULT 0, starts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE nocturne_accounts(id TEXT PRIMARY KEY, recovery_hash TEXT UNIQUE, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL);
CREATE TABLE nocturne_sessions(token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX nocturne_session_expiry ON nocturne_sessions(expires_at);
CREATE TABLE nocturne_records(
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 instrument TEXT NOT NULL, consent TEXT NOT NULL, answers TEXT NOT NULL, dwell TEXT NOT NULL,
 visited INTEGER NOT NULL DEFAULT 0, cursor INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0,
 timeframe TEXT NOT NULL CHECK(timeframe IN ('recent','now')), mood TEXT NOT NULL,
 age TEXT NOT NULL, gender TEXT NOT NULL, time_band TEXT NOT NULL,
 created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL, completed_at INTEGER, profile TEXT
);
CREATE INDEX nocturne_record_owner ON nocturne_records(account_id,created_at DESC);
CREATE INDEX nocturne_record_recent ON nocturne_records(created_at DESC);
CREATE TABLE nocturne_shares(
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 digest TEXT NOT NULL, card TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 UNIQUE(account_id,digest)
);
CREATE INDEX nocturne_share_expiry ON nocturne_shares(expires_at);
CREATE TABLE nocturne_listings(
 id TEXT UNIQUE NOT NULL, account_id TEXT PRIMARY KEY REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 card TEXT NOT NULL, intent TEXT NOT NULL CHECK(intent IN ('similar','complement','any')),
 age TEXT NOT NULL, gender TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX nocturne_listing_recent ON nocturne_listings(hidden,expires_at,created_at DESC);
CREATE TABLE nocturne_interests(
 actor TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 target TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL, PRIMARY KEY(actor,target), CHECK(actor<>target)
);
CREATE TABLE nocturne_blocks(
 actor TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 target TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL, PRIMARY KEY(actor,target), CHECK(actor<>target)
);
CREATE TABLE nocturne_reports(
 actor TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 target TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 reason TEXT NOT NULL CHECK(reason IN ('unwanted','impersonation','underage','other')),
 created_at INTEGER NOT NULL, PRIMARY KEY(actor,target), CHECK(actor<>target)
);
CREATE TRIGGER nocturne_record_start BEFORE INSERT ON nocturne_records
BEGIN
 SELECT CASE WHEN COALESCE((SELECT starts FROM nocturne_quota WHERE day=date('now')),0)>=500 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,starts) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET starts=starts+1;
END;
CREATE TRIGGER nocturne_accounts_insert BEFORE INSERT ON nocturne_accounts
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_accounts_update BEFORE UPDATE ON nocturne_accounts
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_sessions_insert BEFORE INSERT ON nocturne_sessions
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_sessions_update BEFORE UPDATE ON nocturne_sessions
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_records_insert BEFORE INSERT ON nocturne_records
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_records_update BEFORE UPDATE ON nocturne_records
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_shares_insert BEFORE INSERT ON nocturne_shares
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_shares_update BEFORE UPDATE ON nocturne_shares
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_listings_insert BEFORE INSERT ON nocturne_listings
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_listings_update BEFORE UPDATE ON nocturne_listings
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_interests_insert BEFORE INSERT ON nocturne_interests
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_interests_update BEFORE UPDATE ON nocturne_interests
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_blocks_insert BEFORE INSERT ON nocturne_blocks
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_blocks_update BEFORE UPDATE ON nocturne_blocks
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_reports_insert BEFORE INSERT ON nocturne_reports
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
CREATE TRIGGER nocturne_reports_update BEFORE UPDATE ON nocturne_reports
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
