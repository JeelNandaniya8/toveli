import re
import unittest
from pathlib import Path


class BudgetTests(unittest.TestCase):
    def test_atomic_postgres_reservation_contract(self):
        source = Path('app/api/shorts/route.ts').read_text()
        compact = re.sub(r'\s+', ' ', source)
        self.assertIn('ON CONFLICT(owner,day) DO UPDATE', compact)
        self.assertIn('budgets.used<=1195', compact)
        self.assertIn('budgets.lease_until<=', compact)
        self.assertIn('RETURNING used,lease_until', compact)

    def test_cap_and_lease_model(self):
        state = {}

        def reserve(owner, day, now):
            used, lease = state.get((owner, day), (0, 0))
            if used > 1195 or lease > now:
                return None
            state[(owner, day)] = (used + 5, now + 5000)
            return state[(owner, day)]

        self.assertEqual(reserve('a', '2026-09-08', 0), (5, 5000))
        self.assertIsNone(reserve('a', '2026-09-08', 0))
        self.assertEqual(reserve('b', '2026-09-08', 0), (5, 5000))
        for number in range(1, 240):
            self.assertEqual(reserve('a', '2026-09-08', number * 5000)[0], (number + 1) * 5)
        self.assertIsNone(reserve('a', '2026-09-08', 1_200_000))
        self.assertEqual(reserve('a', '2026-09-09', 86_400_000)[0], 5)

    def test_account_scoped_record_key(self):
        migration = next(Path('drizzle').glob('*.sql')).read_text()
        self.assertRegex(migration, r'PRIMARY KEY\("owner","key"\)')


if __name__ == '__main__':
    unittest.main()
