import { Router } from 'express';
import { getConversations, getMessages, markRead, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/conversations', getConversations); // must be before "/:userId"
router.get('/:userId', getMessages);
router.patch('/:userId/read', markRead);
router.delete('/:messageId', deleteMessage);

export default router;