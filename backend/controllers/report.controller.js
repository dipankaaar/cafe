import { ReportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const VALID_RANGES = ['today', 'week', 'month'];

/**
 * GET /api/reports/analytics?range=today|week|month&branchId=br-main|all
 * Always 200 with a zero-filled shape on empty DB — never 500.
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const raw = String(req.query.range || 'today').toLowerCase();
  const range = VALID_RANGES.includes(raw) ? raw : 'today';
  const branchId = req.query.branchId && String(req.query.branchId).trim() !== '' ? String(req.query.branchId).trim() : 'all';
  try {
    const analytics = ReportService.getFinancialAnalytics({ range, branchId });
    return ApiResponse.success(res, analytics);
  } catch (err) {
    return ApiResponse.success(res, ReportService.emptyAnalytics(range, branchId));
  }
});
