import { Router } from 'express';
import * as menuController from '../controllers/menu.controller.js';

const router = Router();

// Products
router.get('/products', menuController.getProducts);
router.get('/products/:id', menuController.getProductById);
router.post('/products', menuController.createProduct);
router.put('/products/:id', menuController.updateProduct);
router.delete('/products/:id', menuController.deleteProduct);

// Categories
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.createCategory);

// Addons
router.get('/addons', menuController.getAddons);
router.post('/addons', menuController.createAddon);

export default router;
