-- New attestations are recorded without reinterpreting older consent.
ALTER TABLE nocturne_records ADD COLUMN choice_policy TEXT;
ALTER TABLE nocturne_accounts ADD COLUMN listing_choice_policy TEXT;
ALTER TABLE nocturne_accounts ADD COLUMN listing_choice_at INTEGER;

-- Checked on every advertising departure, including already-open pages.
CREATE TABLE nocturne_delivery_controls (
 name TEXT PRIMARY KEY CHECK(name='affiliate'),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 updated_at INTEGER NOT NULL
);
INSERT INTO nocturne_delivery_controls(name,enabled,updated_at) VALUES('affiliate',0,0);
