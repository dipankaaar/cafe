import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  isJidBroadcast
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
    this.reconnectTimer = null;
    this.authDir = process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, '..', 'data', 'whatsapp_auth');
    this.isInitializing = false;
    this.isManualLoggingOut = false;
    this.creds = null;
  }

  // Check if a saved credentials session already exists on disk
  hasSavedSession() {
    try {
      const credsPath = path.join(this.authDir, 'creds.json');
      if (!fs.existsSync(credsPath)) return false;
      const raw = fs.readFileSync(credsPath, 'utf8');
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.me?.id || parsed?.account?.details || (parsed?.signalIdentities && parsed.signalIdentities.length > 0));
    } catch {
      return false;
    }
  }

  // Safely clean up and destroy existing socket instance to prevent zombie connections
  cleanupSocket() {
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners();
        if (this.sock.ws) {
          try {
            this.sock.ws.removeAllListeners();
            this.sock.ws.close();
          } catch (e) {}
        }
        if (typeof this.sock.end === 'function') {
          this.sock.end();
        }
      } catch (err) {
        console.warn('⚠️ Notice during WhatsApp socket cleanup:', err?.message);
      }
      this.sock = null;
    }
  }

  // Schedule background reconnection with cancellation safety
  scheduleReconnect(delayMs = 2000) {
    if (this.isManualLoggingOut) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.isInitializing = false;
      this.init().catch((err) => {
        console.warn('⚠️ WhatsApp reconnect error:', err?.message);
      });
    }, delayMs);
  }

  async init() {
    if (this.isInitializing) {
      console.log('⏳ WhatsApp initialization already in progress, skipping concurrent call.');
      return;
    }
    this.isInitializing = true;

    // Clear any pending reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Always tear down any existing socket before instantiating a new one
    this.cleanupSocket();

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      this.creds = state.creds;

      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1043857760] }));

      const sessionExists = this.hasSavedSession();
      this.status = sessionExists ? 'CONNECTING' : 'SCAN_QR';

      console.log(`📱 Initializing WhatsApp Baileys Engine (v${version.join('.')}) [Session: ${sessionExists ? 'Saved' : 'New'}]...`);

      // Initialize Baileys socket with rock-solid production configuration
      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // Standard Chrome on Ubuntu browser tuple recognized natively by WhatsApp Web
        browser: Browsers.ubuntu('Chrome'),
        // Do NOT pull historical chats to prevent memory bloat, I/O bottleneck & timeouts
        syncFullHistory: false,
        // Keep session online & responsive
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 500,
        maxMsgRetryCount: 5,
        generateHighQualityLinkPreview: false,
        shouldIgnoreJid: (jid) => isJidBroadcast(jid),
        getMessage: async () => undefined
      });

      // Save credentials whenever Baileys updates them
      this.sock.ev.on('creds.update', async (newCreds) => {
        try {
          await saveCreds(newCreds);
          if (newCreds?.me) {
            this.creds = { ...(this.creds || {}), ...newCreds };
          }
        } catch (err) {
          console.error('⚠️ Failed saving WhatsApp credentials:', err?.message);
        }
      });

      // Connection state listener
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR Code generated
        if (qr) {
          this.qrString = qr;
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          } catch (e) {
            console.error('❌ Failed to generate QR data URL:', e);
          }
          if (this.status !== 'CONNECTED') {
            this.status = 'SCAN_QR';
          }
          console.log('📷 WhatsApp QR Code generated — Ready for scan in Admin Portal or /api/whatsapp/qr');
        }

        // Connection closed / disconnected
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error)?.output?.statusCode || (lastDisconnect?.error)?.status;
          this.status = 'DISCONNECTED';
          this.qrString = null;
          this.qrDataUrl = null;

          if (this.isManualLoggingOut) {
            console.log('👋 WhatsApp manually logged out by user.');
            this.cleanupSocket();
            this.isInitializing = false;
            return;
          }

          console.warn(`⚠️ WhatsApp disconnected (Status: ${statusCode || 'unknown'}).`);

          this.cleanupSocket();
          this.isInitializing = false;

          // Disconnect reason handling
          if (statusCode === DisconnectReason.restartRequired) {
            // 515: Standard WhatsApp protocol instruction to restart socket with fresh crypto keys
            console.log('🔄 WhatsApp restart required (515) — Reconnecting immediately...');
            this.scheduleReconnect(1000);
          } else if (statusCode === DisconnectReason.connectionReplaced) {
            // 440: Another socket opened; clean up and re-establish single socket
            console.warn('⚠️ WhatsApp connection replaced (440) — Re-establishing single socket session in 3s...');
            this.scheduleReconnect(3000);
          } else if (statusCode === DisconnectReason.loggedOut) {
            // 401: WhatsApp reports logged out
            // CRITICAL USER REQUIREMENT:
            // "ek bar login karte hi jabta khudse remove na karu tabtak removed nehi hona chahiye"
            // We NEVER auto-delete authDir! Preserved until user explicitly clicks 'Remove WhatsApp' in Admin.
            console.warn('⚠️ WhatsApp session reported logged out (401). Preserving credentials as requested. Retrying connection in 15s...');
            this.scheduleReconnect(15000);
          } else {
            // Transient network drops, socket timeouts (408), connectionClosed (428), etc.
            // Infinite auto-reconnect with exponential backoff capped at 15s
            this.reconnectAttempts++;
            const delay = Math.min(2000 * Math.pow(1.3, Math.min(this.reconnectAttempts, 8)), 15000) + Math.floor(Math.random() * 1000);
            console.log(`🔁 WhatsApp auto-reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})...`);
            this.scheduleReconnect(delay);
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrString = null;
          this.qrDataUrl = null;
          this.reconnectAttempts = 0;
          this.isInitializing = false;

          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }

          const me = this.sock?.user || this.creds?.me;
          const userPhone = me?.id ? me.id.split(':')[0].split('@')[0] : 'Unknown';
          const userName = me?.name || '';
          console.log(`✅ WhatsApp Baileys Connected Successfully! Account: ${userName ? userName + ' ' : ''}(+${userPhone}) — Ready to send OTPs.`);
        }
      });
    } catch (error) {
      console.error('❌ WhatsApp Baileys Init Error:', error.message);
      this.status = 'DISCONNECTED';
      this.cleanupSocket();
      this.isInitializing = false;
      this.scheduleReconnect(5000);
    }
  }

  // Explicit user-triggered logout/unlink.
  // ONLY this method is permitted to delete the auth folder!
  async logout() {
    console.log('🚪 User requested WhatsApp session removal...');
    this.isManualLoggingOut = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.sock) {
        await this.sock.logout().catch((e) => {
          console.warn('Notice during sock.logout():', e?.message);
        });
      }
    } catch (e) {}

    this.cleanupSocket();

    // Now, and ONLY now, delete the saved session credentials
    try {
      if (fs.existsSync(this.authDir)) {
        console.log(`🗑️ Manually removing WhatsApp auth session directory: ${this.authDir}`);
        fs.rmSync(this.authDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error('❌ Failed to remove WhatsApp auth directory:', err?.message);
    }

    this.status = 'DISCONNECTED';
    this.qrString = null;
    this.qrDataUrl = null;
    this.reconnectAttempts = 0;
    this.creds = null;
    this.isManualLoggingOut = false;
    this.isInitializing = false;

    // Immediately trigger fresh initialization so a new QR is ready for pairing
    setTimeout(() => {
      this.init().catch(() => {});
    }, 1000);

    return { success: true, message: 'WhatsApp session removed successfully. You can now scan a new QR code.' };
  }

  // Explicit manual reconnect trigger
  async manualReconnect() {
    if (this.status === 'CONNECTED') {
      return { success: true, message: 'WhatsApp is already connected.' };
    }
    this.reconnectAttempts = 0;
    this.cleanupSocket();
    this.isInitializing = false;
    await this.init();
    return { success: true, message: 'Reconnection initiated.' };
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

    const message = `☕ *PETUK ADDA CAFE*\n\nYour *${purpose} Code* is: *${otpCode}*\n\n⏱️ Valid for *5 minutes*.\n🔒 Please do not share this OTP with anyone for security.\n\nIf you experience any issues related to your order or booking, please call or message us through this chat for prompt assistance and resolution.\n\n_Thank you for choosing Petuk Adda Cafe!_`;

    if (this.status === 'CONNECTED' && this.sock) {
      try {
        await this.sock.sendMessage(jid, { text: message });
        console.log(`📨 WhatsApp OTP sent successfully to ${phone}`);
        return { delivered: true, method: 'whatsapp' };
      } catch (err) {
        console.error(`❌ Failed to send WhatsApp message to ${jid}:`, err.message);
        return { delivered: false, simulated: true, method: 'whatsapp_failed', error: err.message };
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
    if (this.status === 'CONNECTED') {
      throw new Error('WhatsApp is already connected');
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
    let userObj = this.sock?.user || this.creds?.me || null;
    if (!userObj && fs.existsSync(path.join(this.authDir, 'creds.json'))) {
      try {
        const raw = fs.readFileSync(path.join(this.authDir, 'creds.json'), 'utf8');
        const parsed = JSON.parse(raw);
        userObj = parsed?.me || null;
      } catch {}
    }

    const phone = userObj?.id ? userObj.id.split(':')[0].split('@')[0] : null;
    const name = userObj?.name || null;

    return {
      status: this.status,
      connected: this.status === 'CONNECTED',
      hasSavedSession: this.hasSavedSession(),
      user: (phone || name) ? { phone, name } : null,
      qrAvailable: !!this.qrDataUrl,
      qrDataUrl: this.qrDataUrl,
      qrString: this.qrString,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const whatsAppService = new WhatsAppService();
