import express from 'express';
import { getWhatsAppStatus, getWhatsAppQr, requestPairingCode } from '../controllers/otp.controller.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', getWhatsAppStatus);

// GET /api/whatsapp/qr
router.get('/qr', getWhatsAppQr);

// POST /api/whatsapp/pair
router.post('/pair', requestPairingCode);

export default router;
