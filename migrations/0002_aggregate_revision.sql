CREATE TABLE research_state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0);
INSERT INTO research_state(id,revision) VALUES(1,0);
CREATE TRIGGER revise_insert AFTER INSERT ON submissions BEGIN UPDATE research_state SET revision=revision+1 WHERE id=1; END;
CREATE TRIGGER revise_delete AFTER DELETE ON submissions BEGIN UPDATE research_state SET revision=revision+1 WHERE id=1; END;
