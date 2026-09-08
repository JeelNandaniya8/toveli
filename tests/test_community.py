import unittest
from pathlib import Path


class CommunityContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.route = Path('app/api/community/route.ts').read_text()
        cls.migration = next(Path('drizzle').glob('*.sql')).read_text()

    def test_discovery_separates_age_group_and_hub(self):
        self.assertIn('profile.cohort === me.cohort', self.route)
        self.assertIn('profile.hub === me.hub', self.route)
        self.assertIn('profile.discoverable', self.route)

    def test_block_is_bidirectional(self):
        self.assertIn('eq(communityBlocks.actor, a)', self.route)
        self.assertIn('eq(communityBlocks.target, b)', self.route)
        self.assertIn('eq(communityBlocks.actor, b)', self.route)
        self.assertIn('eq(communityBlocks.target, a)', self.route)

    def test_messages_require_accepted_connection(self):
        self.assertIn("eq(connectionRequests.state, 'accepted')", self.route)
        self.assertIn("Messages require an accepted connection.", self.route)

    def test_abuse_limits_remain_server_side(self):
        self.assertIn('Number(count) >= 20', self.route)
        self.assertIn('Number(count) >= 60', self.route)

    def test_relationships_cascade_with_profile_deletion(self):
        self.assertGreaterEqual(self.migration.count('ON DELETE cascade'), 7)


if __name__ == '__main__':
    unittest.main()
