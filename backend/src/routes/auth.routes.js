import { Router } from 'express';
import { signup, login, updateProfile, changePassword, joinKitchen } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.patch('/profile', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);
router.post('/join-kitchen', requireAuth, joinKitchen);

export default router;
