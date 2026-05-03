import express from 'express'
import { authMe, searchUserByUsername, test, uploadAvatar } from '../controllers/userController.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get("/me", authMe);

router.get("/test", test);

router.get("/search", searchUserByUsername)

router.post("/uploadAvatar", upload.single("file"), uploadAvatar)

export default router;