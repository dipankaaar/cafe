import express from 'express';
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  requestPairingCode,
  logoutWhatsApp,
  reconnectWhatsApp
} from '../controllers/otp.controller.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', getWhatsAppStatus);

// GET /api/whatsapp/qr
router.get('/qr', getWhatsAppQr);

// POST /api/whatsapp/pair
router.post('/pair', requestPairingCode);

// POST /api/whatsapp/logout (explicit manual removal of WhatsApp session)
router.post('/logout', logoutWhatsApp);

// POST /api/whatsapp/reconnect (manual reconnection trigger)
router.post('/reconnect', reconnectWhatsApp);

export default router;
