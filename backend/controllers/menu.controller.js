import { ProductModel } from '../models/Product.model.js';
import { CategoryModel, AddonModel } from '../models/Category.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { category, available_only, featured_only, search } = req.query;
  const products = ProductModel.findAll({
    category,
    isAvailable: available_only === 'true' ? true : undefined,
    isFeatured: featured_only === 'true' ? true : undefined,
    search
  });
  return ApiResponse.success(res, products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = ProductModel.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return ApiResponse.success(res, product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, sellingPrice } = req.body;
  if (!name || sellingPrice === undefined) {
    throw new ApiError(400, 'Product name and selling price are required');
  }
  const created = ProductModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = ProductModel.update(id, req.body);
  if (!updated) throw new ApiError(404, 'Product not found');
  return ApiResponse.success(res, updated, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const success = ProductModel.delete(id);
  if (!success) throw new ApiError(404, 'Product not found');
  return ApiResponse.success(res, { id, success: true }, 'Product deleted successfully');
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = CategoryModel.findAll();
  return ApiResponse.success(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required');
  const created = CategoryModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const getAddons = asyncHandler(async (req, res) => {
  const addons = AddonModel.findAll();
  return ApiResponse.success(res, addons);
});

export const createAddon = asyncHandler(async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) throw new ApiError(400, 'Addon name and price are required');
  const created = AddonModel.create(req.body);
  return ApiResponse.created(res, created);
});
