import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED'
    this.qrString = null;
    this.qrDataUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.authDir = process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, '..', 'data', 'whatsapp_auth');
    this.isInitializing = false;
  }

  async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

      console.log('📱 Initializing WhatsApp Baileys Engine (version:', version.join('.'), ')...');
      this.status = 'CONNECTING';

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Petuk Adda Cafe', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        generateHighQualityLinkPreview: false
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrString = qr;
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          } catch (e) {
            console.error('Failed to generate QR data URL:', e);
          }
          this.status = 'SCAN_QR';
          console.log('📷 WhatsApp QR Code generated — Ready for scan in Admin Portal or /api/whatsapp/qr');
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          this.status = 'DISCONNECTED';
          this.qrString = null;
          this.qrDataUrl = null;

          console.warn(`⚠️ WhatsApp disconnected (Status: ${statusCode || 'unknown'}). Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(5000 * this.reconnectAttempts, 30000);
            setTimeout(() => {
              this.isInitializing = false;
              this.init();
            }, delay);
          } else if (!shouldReconnect) {
            console.log('🗑️ WhatsApp logged out. Cleaning old session...');
            try {
              fs.rmSync(this.authDir, { recursive: true, force: true });
            } catch (e) {}
            this.reconnectAttempts = 0;
            this.isInitializing = false;
            setTimeout(() => this.init(), 3000);
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrString = null;
          this.qrDataUrl = null;
          this.reconnectAttempts = 0;
          this.isInitializing = false;
          console.log('✅ WhatsApp Baileys Connected Successfully! Ready to send OTPs.');
        }
      });
    } catch (error) {
      console.error('❌ WhatsApp Baileys Init Error:', error.message);
      this.status = 'DISCONNECTED';
      this.isInitializing = false;
    }
  }

  // Format mobile number to standard WhatsApp JID (e.g. 919845011223@s.whatsapp.net)
  formatJid(rawPhone) {
    if (!rawPhone) return null;
    let clean = String(rawPhone).replace(/\D/g, '');
    // If 10 digits (standard Indian mobile), prepend country code 91
    if (clean.length === 10) {
      clean = '91' + clean;
    }
    return `${clean}@s.whatsapp.net`;
  }

  async sendOtp(phone, otpCode, purpose = 'Verification') {
    const jid = this.formatJid(phone);
    if (!jid) {
      throw new Error('Invalid mobile number provided');
    }

    const message = `☕ *PETUK ADDA CAFE*\n\nYour *${purpose} Code* is: *${otpCode}*\n\n⏱️ Valid for *5 minutes*.\n🔒 Please do not share this OTP with anyone for security.\n\n_Thank you for choosing Petuk Adda Cafe!_`;

    if (this.status === 'CONNECTED' && this.sock) {
      try {
        await this.sock.sendMessage(jid, { text: message });
        console.log(`📨 WhatsApp OTP sent successfully to ${phone}`);
        return { delivered: true, method: 'whatsapp' };
      } catch (err) {
        console.error(`❌ Failed to send WhatsApp message to ${jid}:`, err.message);
        return { delivered: false, method: 'whatsapp', error: err.message };
      }
    } else {
      console.warn(`⚠️ WhatsApp service status is "${this.status}". Simulated delivery for OTP ${otpCode} to ${phone}.`);
      return { delivered: false, simulated: true, status: this.status };
    }
  }

  async requestPairingCode(phoneNumber) {
    if (!this.sock) {
      throw new Error('WhatsApp service is not initialized');
    }
    let clean = String(phoneNumber).replace(/\D/g, '');
    if (clean.length === 10) clean = '91' + clean;
    try {
      const code = await this.sock.requestPairingCode(clean);
      return code;
    } catch (err) {
      throw new Error(`Failed to request pairing code: ${err.message}`);
    }
  }

  getStatus() {
    return {
      status: this.status,
      connected: this.status === 'CONNECTED',
      qrAvailable: !!this.qrDataUrl,
      qrDataUrl: this.qrDataUrl,
      qrString: this.qrString
    };
  }
}

export const whatsAppService = new WhatsAppService();
