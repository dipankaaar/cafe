import { ExpenseModel } from '../models/System.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getExpenses = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const expenses = ExpenseModel.findAll({ category });
  return ApiResponse.success(res, expenses);
});

export const createExpense = asyncHandler(async (req, res) => {
  const { title, amount } = req.body;
  if (!title || !amount) throw new ApiError(400, 'Title and amount are required');
  const created = ExpenseModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const success = ExpenseModel.delete(id);
  if (!success) throw new ApiError(404, 'Expense not found');
  return ApiResponse.success(res, { id, success: true }, 'Expense deleted');
});
