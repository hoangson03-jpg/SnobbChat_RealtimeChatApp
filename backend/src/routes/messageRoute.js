import express, { Router } from 'express';
import {upload} from '../middlewares/uploadMiddleware.js';
import { sendDirectMessage, sendGroupMessage, sendImageMessage } from '../controllers/messageController.js';
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware.js';

const router = express.Router();

router.post('/direct',checkFriendship, sendDirectMessage);

router.post('/group', checkGroupMembership, sendGroupMessage);

router.post('/upload-image', upload.single('image'), sendImageMessage);

export default router;