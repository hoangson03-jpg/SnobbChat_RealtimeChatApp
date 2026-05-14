import express from "express";
import { signUp, signIn, signOut, refreshToken, resendOTP } from "../controllers/authController.js";
import { authMe } from "../controllers/userController.js";
import { verifyOTP } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/verify-otp", verifyOTP);

router.post("/resend-otp", resendOTP);

router.post("/signin", signIn);

router.post("/signout", signOut);

router.get("/users", authMe)

router.post("/refresh", refreshToken);

export default router;