import unittest
from services.matching.engine import normalized,update_behavior,Signal,score,effective_vector
class MatchingTests(unittest.TestCase):
    def test_zero_and_empty_batch_are_stable(self):
        self.assertEqual(normalized([0,0]),(0,0))
        self.assertEqual(update_behavior([1,0],[]),(1,0))
        self.assertEqual(update_behavior([0,0],[Signal((0,0),1)]),(0,0))
    def test_bad_vectors_and_weights_rejected(self):
        for signal in [Signal((1,0),-1),Signal((float('nan'),0),1),Signal((1,),1)]:
            with self.assertRaises(ValueError):update_behavior([1,0],[signal])
    def test_revocation_removes_behavior(self):
        self.assertEqual(effective_vector([1,0],[0,1],False,100),(1,0))
        blended=effective_vector([1,0],[0,1],True,100)
        self.assertGreater(blended[0],blended[1])
    def test_matching_bounds_and_hub_priority(self):
        self.assertAlmostEqual(score([1,0],[1,0],True,True,True)['total'],1)
        self.assertGreater(score([1,0],[1,0],True,True,False)['total'],score([1,0],[1,0],False,True,False)['total'])
        self.assertEqual(score([1,0],[-1,0],False,False,False)['total'],0)
if __name__=='__main__':unittest.main()
