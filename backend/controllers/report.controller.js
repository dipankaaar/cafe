import { ReportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = ReportService.getFinancialAnalytics();
  return ApiResponse.success(res, analytics);
});
