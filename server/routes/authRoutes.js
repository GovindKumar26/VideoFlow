import express from "express";
import { register, login, getCurrentUser, logout, updateProfileSettings, changePassword } from "../controllers/authController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser)
router.post('/logout', logout);
router.patch("/settings", auth, updateProfileSettings);
router.post("/change-password", auth, changePassword);

export default router;
