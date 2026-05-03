import express from "express";
import { signUp, signIn, signOut, refreshToken } from "../controllers/authController.js";
import { authMe } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/signin", signIn);

router.post("/signout", signOut);

router.get("/users", authMe)

router.post("/refresh", refreshToken);

export default router;