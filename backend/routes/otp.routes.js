import express from 'express';
import { sendOtp, verifyOtp } from '../controllers/otp.controller.js';

const router = express.Router();

// POST /api/otp/send -> { phone, context }
router.post('/send', sendOtp);

// POST /api/otp/verify -> { phone, otp, name, email, address }
router.post('/verify', verifyOtp);

export default router;
