import { BranchModel } from '../models/Branch.model.js';
import { AuditLogModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getBranches = asyncHandler(async (req, res) => {
  const branches = BranchModel.findAll().map((b) => ({ ...b, stats: BranchModel.getStats(b.id) }));
  return ApiResponse.success(res, branches);
});

export const getBranchById = asyncHandler(async (req, res) => {
  const branch = BranchModel.findById(req.params.id);
  if (!branch) throw new ApiError(404, 'Branch not found');
  return ApiResponse.success(res, { ...branch, stats: BranchModel.getStats(branch.id) });
});

export const createBranch = asyncHandler(async (req, res) => {
  let created;
  try {
    created = BranchModel.create(req.body || {});
  } catch (e) {
    throw new ApiError(400, e.message || 'Could not create branch');
  }
  AuditLogModel.log({
    user: 'Admin', action: 'CREATE_BRANCH', category: 'Branches',
    details: `Opened branch ${created.name} (${created.code})`,
    ip: req.ip || '127.0.0.1'
  });
  eventHub.broadcast('BRANCH_CREATED', created);
  return ApiResponse.created(res, created);
});

export const updateBranch = asyncHandler(async (req, res) => {
  let updated;
  try {
    updated = BranchModel.update(req.params.id, req.body || {});
  } catch (e) {
    throw new ApiError(400, e.message || 'Could not update branch');
  }
  if (!updated) throw new ApiError(404, 'Branch not found');
  eventHub.broadcast('BRANCH_UPDATED', updated);
  return ApiResponse.success(res, updated, 'Branch updated');
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const existing = BranchModel.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Branch not found');
  try {
    BranchModel.delete(req.params.id);
  } catch (e) {
    throw new ApiError(409, e.message || 'Could not delete branch');
  }
  AuditLogModel.log({
    user: 'Admin', action: 'DELETE_BRANCH', category: 'Branches',
    details: `Closed branch ${existing.name} (${existing.code})`,
    ip: req.ip || '127.0.0.1'
  });
  eventHub.broadcast('BRANCH_DELETED', { id: req.params.id });
  return ApiResponse.success(res, { id: req.params.id }, 'Branch deleted');
});
