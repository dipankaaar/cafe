import { Router } from 'express';
import * as invController from '../controllers/inventory.controller.js';

const router = Router();

// Inventory items
router.get('/', invController.getInventory);
router.post('/', invController.createInventoryItem);
router.post('/adjust', invController.adjustInventory);

// Suppliers
router.get('/suppliers', invController.getSuppliers);
router.post('/suppliers', invController.createSupplier);

// Purchases
router.get('/purchases', invController.getPurchases);
router.post('/purchases', invController.createPurchaseOrder);

export default router;
