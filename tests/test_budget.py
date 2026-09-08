import sqlite3,unittest,re
from pathlib import Path
class BudgetTests(unittest.TestCase):
    def test_limit_concurrent_lease_reset_and_ownership(self):
        db=sqlite3.connect(':memory:')
        db.executescript(Path('drizzle/0000_shocking_vanisher.sql').read_text())
        source=Path('app/api/shorts/route.ts').read_text()
        sql=re.search(r"prepare\('(INSERT INTO budgets.*?)'\)",source).group(1)
        def reserve(who,day,now):return db.execute(sql,(who,day,now+5000,now)).fetchone()
        self.assertEqual(reserve('a','2026-09-07',0)[0],5)
        self.assertIsNone(reserve('a','2026-09-07',0))
        self.assertEqual(reserve('b','2026-09-07',0)[0],5)
        for n in range(1,240):self.assertEqual(reserve('a','2026-09-07',n*5000)[0],(n+1)*5)
        self.assertIsNone(reserve('a','2026-09-07',1200000))
        self.assertEqual(reserve('a','2026-09-08',86400000)[0],5)
    def test_compound_owner_keys(self):
        db=sqlite3.connect(':memory:');db.executescript(Path('drizzle/0000_shocking_vanisher.sql').read_text())
        db.execute('INSERT INTO records VALUES (?,?,?,?)',('a','draft:aarav','private A',0))
        db.execute('INSERT INTO records VALUES (?,?,?,?)',('b','draft:aarav','private B',0))
        db.execute('DELETE FROM records WHERE owner=? AND key=?',('a','draft:aarav'))
        self.assertEqual(db.execute('SELECT value FROM records WHERE owner=?',('b',)).fetchone()[0],'private B')
if __name__=='__main__':unittest.main()
