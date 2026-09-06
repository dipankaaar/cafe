import { ExpenseModel, AuditLogModel } from '../models/System.model.js';
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
  AuditLogModel.log({
    user: req.body.loggedBy || 'Admin',
    action: 'ADD_EXPENSE',
    category: 'Expenses',
    details: `Logged ₹${Number(req.body.amount)} expense under "${req.body.category || 'General'}": ${req.body.title}`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.created(res, created);
});

export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = ExpenseModel.update(id, req.body);
  if (!updated) throw new ApiError(404, 'Expense not found');
  AuditLogModel.log({
    user: 'Admin',
    action: 'UPDATE_EXPENSE',
    category: 'Expenses',
    details: `Updated expense "${updated.title}" (₹${updated.amount})`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, updated, 'Expense updated');
});

export const monthlySummary = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const summary = ExpenseModel.monthlyTotal(month);
  return ApiResponse.success(res, summary);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const success = ExpenseModel.delete(id);
  if (!success) throw new ApiError(404, 'Expense not found');
  AuditLogModel.log({
    user: 'Admin',
    action: 'DELETE_EXPENSE',
    category: 'Expenses',
    details: `Deleted expense ID ${id}`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, { id, success: true }, 'Expense deleted');
});
