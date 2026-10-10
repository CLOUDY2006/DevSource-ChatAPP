import { Router } from 'express';
import { searchUsers, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/search', protect, searchUsers);
router.patch('/me', protect, updateProfile);

export default router;