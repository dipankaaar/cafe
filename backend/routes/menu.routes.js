import { Router } from 'express';
import * as menuController from '../controllers/menu.controller.js';

const router = Router();

// Products — GET/POST/PUT/PATCH/DELETE (PATCH aliases PUT for partial updates)
router.get('/products', menuController.getProducts);
router.get('/products/:id', menuController.getProductById);
router.post('/products', menuController.createProduct);
router.put('/products/:id', menuController.updateProduct);
router.patch('/products/:id', menuController.updateProduct);
router.delete('/products/:id', menuController.deleteProduct);

// Categories — full CRUD
router.get('/categories', menuController.getCategories);
router.get('/categories/:id', menuController.getCategoryById);
router.post('/categories', menuController.createCategory);
router.put('/categories/:id', menuController.updateCategory);
router.patch('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

// Addons / Variants — full CRUD
router.get('/addons', menuController.getAddons);
router.get('/addons/:id', menuController.getAddonById);
router.post('/addons', menuController.createAddon);
router.put('/addons/:id', menuController.updateAddon);
router.patch('/addons/:id', menuController.updateAddon);
router.delete('/addons/:id', menuController.deleteAddon);

export default router;
