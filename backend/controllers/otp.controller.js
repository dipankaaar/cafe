import { otpService } from '../services/otp.service.js';
import { whatsAppService } from '../services/whatsapp.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { phone, context } = req.body;
  if (!phone) {
    throw new ApiError(400, 'Mobile phone number is required');
  }

  const result = await otpService.sendMobileOtp(phone, context || 'Customer Login');
  return ApiResponse.success(res, result, 'OTP sent successfully via WhatsApp');
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, name, email, address, landmark } = req.body;
  if (!phone || !otp) {
    throw new ApiError(400, 'Phone number and OTP code are required');
  }

  const result = await otpService.verifyMobileOtp(phone, otp, { name, email, address, landmark });
  return ApiResponse.success(res, result, result.message || 'Mobile OTP verified successfully');
});

export const completeProfile = asyncHandler(async (req, res) => {
  const { phone, name, address, landmark, email } = req.body;
  if (!phone) {
    throw new ApiError(400, 'Phone number is required');
  }

  const result = await otpService.completeCustomerProfile({ phone, name, address, landmark, email });
  return ApiResponse.success(res, result, result.message || 'Customer profile completed successfully');
});

export const getWhatsAppStatus = asyncHandler(async (req, res) => {
  const status = whatsAppService.getStatus();
  return ApiResponse.success(res, status);
});

export const getWhatsAppQr = asyncHandler(async (req, res) => {
  const status = whatsAppService.getStatus();
  if (status.qrDataUrl) {
    return ApiResponse.success(res, {
      qrDataUrl: status.qrDataUrl,
      status: status.status
    });
  }
  return ApiResponse.success(res, {
    status: status.status,
    message: status.connected ? 'WhatsApp is already connected!' : 'QR code is not ready yet. Please wait...'
  });
});

export const requestPairingCode = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    throw new ApiError(400, 'Phone number is required for pairing code');
  }
  const code = await whatsAppService.requestPairingCode(phone);
  return ApiResponse.success(res, { code }, 'Pairing code generated');
});
