import { Router } from 'express';
import { requireAuth, requireKitchenAccess, requireOwner } from '../middleware/auth.js';
import * as household from '../controllers/household.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireKitchenAccess);

router.get('/household', household.getHousehold);
router.post('/household/rotate-code', requireOwner, household.rotateInviteCode);
router.delete('/household/members/:userId', requireOwner, household.removeMember);
router.post('/household/leave', household.leaveKitchen);

export default router;
