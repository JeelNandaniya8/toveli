import sqlite3
import unittest
from pathlib import Path

class CommunitySchemaTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys=ON')
        for path in sorted(Path('drizzle').glob('*.sql')):
            self.db.executescript(path.read_text().replace('--> statement-breakpoint',''))
        profiles=[
            ('a','pa','A','Silver Oak University','teen','a','["Coding"]','Make friends',0,1,1,1),
            ('b','pb','B','Silver Oak University','teen','b','["Coding"]','Make friends',0,1,1,1),
            ('c','pc','C','Silver Oak University','adult','c','["Coding"]','Make friends',0,1,1,1),
            ('d','pd','D','Nirma University','teen','d','["Coding"]','Make friends',0,1,1,1),
        ]
        self.db.executemany('INSERT INTO community_profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',profiles)
    def test_discovery_separates_age_group_and_hub(self):
        rows=self.db.execute("SELECT public_id FROM community_profiles WHERE owner<>? AND discoverable=1 AND cohort=? AND hub=?",('a','teen','Silver Oak University')).fetchall()
        self.assertEqual(rows,[('pb',)])
    def test_block_is_bidirectional_for_discovery(self):
        self.db.execute('INSERT INTO community_blocks VALUES (?,?,?)',('b','a',2))
        rows=self.db.execute("SELECT public_id FROM community_profiles p WHERE p.owner<>? AND p.cohort=? AND p.hub=? AND NOT EXISTS (SELECT 1 FROM community_blocks b WHERE (b.actor=? AND b.target=p.owner) OR (b.actor=p.owner AND b.target=?))",('a','teen','Silver Oak University','a','a')).fetchall()
        self.assertEqual(rows,[])
    def test_messages_require_accepted_connection_contract(self):
        self.db.execute("INSERT INTO connection_requests VALUES (?,?,?,?,?,?)",('r','a','b','pending',1,1))
        allowed=self.db.execute("SELECT EXISTS(SELECT 1 FROM connection_requests WHERE state='accepted' AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?)))",('a','b','b','a')).fetchone()[0]
        self.assertEqual(allowed,0)
        self.db.execute("UPDATE connection_requests SET state='accepted' WHERE id='r'")
        allowed=self.db.execute("SELECT EXISTS(SELECT 1 FROM connection_requests WHERE state='accepted' AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?)))",('a','b','b','a')).fetchone()[0]
        self.assertEqual(allowed,1)
    def test_profile_delete_cascades_relationships(self):
        self.db.execute("INSERT INTO connection_requests VALUES (?,?,?,?,?,?)",('r','a','b','accepted',1,1))
        self.db.execute("INSERT INTO community_messages VALUES (?,?,?,?,?)",('m','a','b','hello',2))
        self.db.execute("DELETE FROM community_profiles WHERE owner='b'")
        self.assertEqual(self.db.execute('SELECT count(*) FROM connection_requests').fetchone()[0],0)
        self.assertEqual(self.db.execute('SELECT count(*) FROM community_messages').fetchone()[0],0)

if __name__=='__main__': unittest.main()
