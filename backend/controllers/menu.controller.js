import { ProductModel } from '../models/Product.model.js';
import { CategoryModel, AddonModel } from '../models/Category.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { category, available_only, featured_only, search, channel, menu_type } = req.query;
  const products = ProductModel.findAll({
    category,
    isAvailable: available_only === 'true' ? true : undefined,
    isFeatured: featured_only === 'true' ? true : undefined,
    search,
    channel: channel || menu_type
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
  const b = req.body || {};
  const name = b.name;
  const price = b.sellingPrice ?? b.selling_price ?? b.price ?? b.onlinePrice ?? b.online_price ?? b.tablePrice ?? b.table_price;
  if (!name || price === undefined) {
    throw new ApiError(400, 'Product name and at least one price (tablePrice/onlinePrice/sellingPrice) are required');
  }
  // Accept base64 data-URL or http(s) URL for image; stored as-is (10mb JSON limit in app.js)
  if (b.image !== undefined || b.image_url !== undefined || b.imageUrl !== undefined) {
    const img = b.image ?? b.image_url ?? b.imageUrl;
    if (img !== null && typeof img !== 'string') throw new ApiError(400, 'Product image must be a URL or base64 string');
    if (typeof img === 'string' && img.length > 10 * 1024 * 1024) throw new ApiError(400, 'Product image too large (max ~10MB)');
  }
  const created = ProductModel.create(b);
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

export const getCategoryById = asyncHandler(async (req, res) => {
  const cat = CategoryModel.findById(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  return ApiResponse.success(res, cat);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required');
  const created = CategoryModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updated = CategoryModel.update(req.params.id, req.body);
  if (!updated) throw new ApiError(404, 'Category not found');
  return ApiResponse.success(res, updated, 'Category updated successfully');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const success = CategoryModel.delete(req.params.id);
  if (!success) throw new ApiError(404, 'Category not found');
  return ApiResponse.success(res, { id: req.params.id, success: true }, 'Category deleted successfully');
});

export const getAddons = asyncHandler(async (req, res) => {
  const addons = AddonModel.findAll();
  return ApiResponse.success(res, addons);
});

export const getAddonById = asyncHandler(async (req, res) => {
  const addon = AddonModel.findById(req.params.id);
  if (!addon) throw new ApiError(404, 'Addon not found');
  return ApiResponse.success(res, addon);
});

export const createAddon = asyncHandler(async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) throw new ApiError(400, 'Addon name and price are required');
  const created = AddonModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const updateAddon = asyncHandler(async (req, res) => {
  const updated = AddonModel.update(req.params.id, req.body);
  if (!updated) throw new ApiError(404, 'Addon not found');
  return ApiResponse.success(res, updated, 'Addon updated successfully');
});

export const deleteAddon = asyncHandler(async (req, res) => {
  const success = AddonModel.delete(req.params.id);
  if (!success) throw new ApiError(404, 'Addon not found');
  return ApiResponse.success(res, { id: req.params.id, success: true }, 'Addon deleted successfully');
});
