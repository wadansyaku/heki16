ALTER TABLE nocturne_accounts ADD COLUMN listing_preference INTEGER CHECK(listing_preference IN (0,1));
ALTER TABLE nocturne_accounts ADD COLUMN listing_revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE nocturne_listings ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nocturne_listings ADD COLUMN record_id TEXT;
ALTER TABLE nocturne_shares ADD COLUMN revoked_at INTEGER;
CREATE TABLE nocturne_publication_consents(
 account_id TEXT NOT NULL REFERENCES nocturne_accounts(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, policy TEXT NOT NULL, digest TEXT NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(account_id,revision)
);

-- Taking a card or link down remains available when the new-write budget is exhausted.
DROP TRIGGER nocturne_accounts_update;
CREATE TRIGGER nocturne_accounts_update BEFORE UPDATE ON nocturne_accounts
WHEN NOT (NEW.listing_preference=0 AND NEW.listing_revision=OLD.listing_revision+1
 AND NEW.id=OLD.id AND NEW.recovery_hash IS OLD.recovery_hash
 AND NEW.created_at=OLD.created_at AND NEW.last_seen=OLD.last_seen
 AND NEW.moderation_hold=OLD.moderation_hold)
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
DROP TRIGGER nocturne_shares_update;
CREATE TRIGGER nocturne_shares_update BEFORE UPDATE ON nocturne_shares
WHEN NOT (NEW.revoked_at IS NOT NULL AND NEW.id=OLD.id AND NEW.account_id=OLD.account_id
 AND NEW.digest=OLD.digest AND NEW.card=OLD.card AND NEW.created_at=OLD.created_at
 AND NEW.expires_at=OLD.expires_at)
BEGIN
 SELECT CASE WHEN COALESCE((SELECT writes FROM nocturne_quota WHERE day=date('now')),0)>=10000 THEN RAISE(ABORT,'nocturne_capacity') END;
 INSERT INTO nocturne_quota(day,writes) VALUES(date('now'),1) ON CONFLICT(day) DO UPDATE SET writes=writes+1;
END;
