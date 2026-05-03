import express from 'express'
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, getAllFriends, getFriendsRequest } from '../controllers/friendController.js'

const router = express.Router();

router.post("/requests", sendFriendRequest);

router.post("/requests/:requestId/accept", acceptFriendRequest);

router.post("/requests/:requestId/declined", declineFriendRequest);

router.get("/", getAllFriends);

router.get("/requests", getFriendsRequest);

export default router;