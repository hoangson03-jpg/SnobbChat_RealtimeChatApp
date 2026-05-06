import express from 'express'
import { createConversation, getConversation, getMessages, deleteConversation, markAsSeen } from '../controllers/conversationController.js'
import { checkFriendship } from '../middlewares/friendMiddleware.js';
import { protectedRoute } from '../middlewares/authMiddleware.js'

const route = express.Router();

route.post("/", checkFriendship ,createConversation);

route.get("/",getConversation);

route.get("/:conversationId/messages", getMessages);

route.patch("/:conversationId/seen", markAsSeen);

route.delete("/:conversationId", protectedRoute, deleteConversation);

export default route;