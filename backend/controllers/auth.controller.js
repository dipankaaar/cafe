import { StaffModel, AuditLogModel } from '../models/System.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email address is required');
  }

  const staff = StaffModel.findByEmail(email);
  if (!staff) {
    throw new ApiError(401, 'Invalid staff credentials or account is inactive');
  }

  AuditLogModel.log({
    user: `${staff.name} (${staff.role})`,
    action: 'USER_LOGIN',
    category: 'Auth',
    details: `Staff member logged in with role ${staff.role}`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.success(res, {
    success: true,
    user: staff
  }, 'Login successful');
});

export const getStaff = asyncHandler(async (req, res) => {
  const staffMembers = StaffModel.findAll();
  return ApiResponse.success(res, staffMembers);
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, role, phone, shift, avatar } = req.body;
  if (!name || !email) {
    throw new ApiError(400, 'Staff name and email are required');
  }

  const created = StaffModel.create({ name, email, role, phone, shift, avatar });
  return ApiResponse.created(res, created);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = StaffModel.update(id, req.body);
  if (!updated) {
    throw new ApiError(404, 'Staff member not found');
  }
  return ApiResponse.success(res, updated, 'Staff updated successfully');
});
