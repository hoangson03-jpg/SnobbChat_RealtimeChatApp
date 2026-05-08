import express from 'express'
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, getAllFriends, getFriendsRequest, removeFriend } from '../controllers/friendController.js'
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/requests", sendFriendRequest);

router.post("/requests/:requestId/accept", acceptFriendRequest);

router.post("/requests/:requestId/declined", declineFriendRequest);

router.get("/", getAllFriends);

router.get("/requests", getFriendsRequest);

router.delete("/:friendId", protectedRoute, removeFriend);

export default router;