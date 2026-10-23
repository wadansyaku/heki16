-- New diagnoses use the required participation flow. Historical records stay unchanged.
ALTER TABLE nocturne_records ADD COLUMN entry_policy TEXT;
ALTER TABLE nocturne_records ADD COLUMN first_published_at INTEGER;
