import express from 'express';
import { sendOtp, verifyOtp, completeProfile } from '../controllers/otp.controller.js';

const router = express.Router();

// POST /api/otp/send -> { phone, context }
router.post('/send', sendOtp);

// POST /api/otp/verify -> { phone, otp, name, email, address, landmark }
router.post('/verify', verifyOtp);

// POST /api/otp/complete-profile -> { phone, name, address, landmark, email }
router.post('/complete-profile', completeProfile);

export default router;
