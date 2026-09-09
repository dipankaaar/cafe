import { whatsAppService } from './whatsapp.service.js';
import { CustomerModel } from '../models/Customer.model.js';
import { normalizeIndianPhone } from '../utils/helpers.js';

class OtpService {
  constructor() {
    // In-memory store for active OTP codes: phone -> { otp, expiresAt, attempts, createdAt }
    this.otpStore = new Map();
    // Throttle store: phone -> lastRequestedTimestamp
    this.throttleStore = new Map();
    // Verified session store for new customer profile completion: phone -> { verifiedAt, expiresAt }
    this.verifiedSessions = new Map();
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
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new Error('Please provide a valid 10-digit Indian mobile number');
    }

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

    // 3. Check if existing customer account
    const existingCustomer = CustomerModel.findByPhone(cleanPhone);

    // 4. Dispatch via WhatsApp Baileys
    const dispatchResult = await whatsAppService.sendOtp(cleanPhone, otp, context);

    return {
      success: true,
      phone: cleanPhone,
      isExistingCustomer: !!existingCustomer,
      customerPreview: existingCustomer ? {
        name: existingCustomer.name
      } : null,
      expiresInSeconds: 300,
      channel: dispatchResult.delivered ? 'whatsapp' : 'whatsapp_simulated'
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

    // OTP is valid! Remove from active OTP store
    this.otpStore.delete(cleanPhone);

    // Store verified session (valid for 15 minutes for profile completion if new)
    this.verifiedSessions.set(cleanPhone, {
      verifiedAt: now,
      expiresAt: now + 15 * 60 * 1000
    });

    // Check if customer already exists in database
    const existingCustomer = CustomerModel.findByPhone(cleanPhone);
    if (existingCustomer) {
      this.verifiedSessions.delete(cleanPhone);
      return {
        success: true,
        isNewCustomer: false,
        isExistingCustomer: true,
        customer: existingCustomer,
        message: `Welcome back, ${existingCustomer.name}! Logged in successfully.`
      };
    }

    // Customer is new: check if all mandatory profile fields were provided in this call
    const hasMandatory =
      profileData.name &&
      String(profileData.name).trim().length >= 2 &&
      profileData.address &&
      String(profileData.address).trim().length >= 3 &&
      profileData.landmark &&
      String(profileData.landmark).trim().length >= 2;

    if (hasMandatory) {
      const fullAddress = [
        String(profileData.address).trim(),
        `(Landmark: ${String(profileData.landmark).trim()})`
      ].join(' ');

      const newCustomer = CustomerModel.create({
        name: String(profileData.name).trim(),
        phone: cleanPhone,
        email: profileData.email ? String(profileData.email).trim() : '',
        address: String(profileData.address).trim(),
        landmark: String(profileData.landmark).trim(),
        notes: fullAddress
      });

      this.verifiedSessions.delete(cleanPhone);

      return {
        success: true,
        isNewCustomer: false,
        customer: newCustomer,
        message: 'Customer profile created and logged in successfully.'
      };
    }

    // Return new customer flag requiring mandatory profile completion
    return {
      success: true,
      isNewCustomer: true,
      phone: cleanPhone,
      message: 'OTP verified successfully. Please complete your profile details.'
    };
  }

  async completeCustomerProfile({ phone, name, address, landmark, email }) {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new Error('Valid 10-digit Indian mobile number is required');
    }

    // Verify that this phone has an active verified session
    const session = this.verifiedSessions.get(cleanPhone);
    if (!session || Date.now() > session.expiresAt) {
      this.verifiedSessions.delete(cleanPhone);
      throw new Error('Verification session has expired. Please verify with WhatsApp OTP again.');
    }

    // If customer already exists, return existing profile
    const existingCustomer = CustomerModel.findByPhone(cleanPhone);
    if (existingCustomer) {
      this.verifiedSessions.delete(cleanPhone);
      return {
        success: true,
        isNewCustomer: false,
        isExistingCustomer: true,
        customer: existingCustomer,
        message: `Welcome back, ${existingCustomer.name}! Logged in successfully.`
      };
    }

    // Enforce mandatory fields: Full Name, Full Address, Landmark
    if (!name || !String(name).trim() || String(name).trim().length < 2) {
      throw new Error('Full Name is mandatory and must be at least 2 characters.');
    }
    if (!address || !String(address).trim() || String(address).trim().length < 3) {
      throw new Error('Full Address is mandatory.');
    }
    if (!landmark || !String(landmark).trim() || String(landmark).trim().length < 2) {
      throw new Error('Landmark is mandatory.');
    }

    const fullAddress = [
      String(address).trim(),
      `(Landmark: ${String(landmark).trim()})`
    ].join(' ');

    const newCustomer = CustomerModel.create({
      name: String(name).trim(),
      phone: cleanPhone,
      email: email ? String(email).trim() : '',
      address: String(address).trim(),
      landmark: String(landmark).trim(),
      notes: fullAddress
    });

    this.verifiedSessions.delete(cleanPhone);

    return {
      success: true,
      isNewCustomer: false,
      customer: newCustomer,
      message: 'Customer profile created successfully. Welcome to Petuk Adda Cafe!'
    };
  }
}

export const otpService = new OtpService();
