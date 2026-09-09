import { whatsAppService } from './whatsapp.service.js';
import { CustomerModel } from '../models/Customer.model.js';
import { normalizeIndianPhone } from '../utils/helpers.js';

class OtpService {
  constructor() {
    // In-memory store for fast and ephemeral OTP handling
    this.otpStore = new Map();
    // Throttle store: phone -> lastRequestedTimestamp
    this.throttleStore = new Map();
  }

  // Generate clean 6-digit numeric OTP
  generateOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendMobileOtp(phone, context = 'Customer Login') {
    if (!phone || String(phone).trim().length < 10) {
      throw new Error('Please provide a valid 10-digit mobile number');
    }

    const cleanPhone = normalizeIndianPhone(phone);
    const now = Date.now();

    // 1. Throttle check (min 20 seconds between requests)
    const lastSent = this.throttleStore.get(cleanPhone);
    if (lastSent && now - lastSent < 20000) {
      const waitSeconds = Math.ceil((20000 - (now - lastSent)) / 1000);
      throw new Error(`Please wait ${waitSeconds}s before requesting a new OTP`);
    }

    // 2. Generate and store OTP (valid for 5 minutes)
    const otp = this.generateOtpCode();
    const expiresAt = now + 5 * 60 * 1000;

    this.otpStore.set(cleanPhone, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: now
    });
    this.throttleStore.set(cleanPhone, now);

    // 3. Dispatch via WhatsApp Baileys
    const dispatchResult = await whatsAppService.sendOtp(cleanPhone, otp, context);

    return {
      success: true,
      phone: cleanPhone,
      expiresInSeconds: 300,
      channel: dispatchResult.delivered ? 'whatsapp' : 'whatsapp_simulated',
      // In development / demo mode when WhatsApp is pairing, we return debug preview
      debugOtp: process.env.NODE_ENV !== 'production' || !dispatchResult.delivered ? otp : undefined
    };
  }

  async verifyMobileOtp(phone, inputOtp, profileData = {}) {
    if (!phone || !inputOtp) {
      throw new Error('Mobile number and OTP are required');
    }

    const cleanPhone = normalizeIndianPhone(phone);
    const record = this.otpStore.get(cleanPhone);

    if (!record) {
      throw new Error('No active OTP found. Please request a new OTP.');
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      this.otpStore.delete(cleanPhone);
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (record.attempts >= 4) {
      this.otpStore.delete(cleanPhone);
      throw new Error('Too many invalid attempts. Please request a new OTP.');
    }

    // Compare OTP (trim whitespace)
    if (String(record.otp).trim() !== String(inputOtp).trim()) {
      record.attempts += 1;
      throw new Error(`Invalid OTP code. (${4 - record.attempts} attempts remaining)`);
    }

    // OTP is valid! Remove from store
    this.otpStore.delete(cleanPhone);

    const fullAddress = [
      profileData.address?.trim(),
      profileData.landmark?.trim() ? `(Landmark: ${profileData.landmark.trim()})` : ''
    ].filter(Boolean).join(' ');

    // Find or create customer record in database
    let customer = CustomerModel.findByPhone(cleanPhone);
    if (!customer) {
      customer = CustomerModel.create({
        name: profileData.name?.trim() || `Customer (${cleanPhone.slice(-4)})`,
        phone: cleanPhone,
        email: profileData.email?.trim() || '',
        notes: fullAddress || ''
      });
    } else if (profileData.name || profileData.email || profileData.address || profileData.landmark) {
      customer = CustomerModel.update(customer.id, {
        name: profileData.name?.trim() || customer.name,
        email: profileData.email?.trim() || customer.email,
        notes: fullAddress || customer.notes
      });
    }

    return {
      success: true,
      customer,
      message: 'Mobile verification successful'
    };
  }
}

export const otpService = new OtpService();
