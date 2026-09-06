import { Router } from 'express';
import * as invController from '../controllers/inventory.controller.js';

const router = Router();

// Stock adjustments (must precede /:id so "adjust" is not treated as an id)
router.post('/adjust', invController.adjustInventory);

// Suppliers — full CRUD (must precede /:id)
router.get('/suppliers', invController.getSuppliers);
router.post('/suppliers', invController.createSupplier);
router.get('/suppliers/:id', invController.getSupplierById);
router.put('/suppliers/:id', invController.updateSupplier);
router.patch('/suppliers/:id', invController.updateSupplier);
router.delete('/suppliers/:id', invController.deleteSupplier);

// Purchases — PO create / receive / CRUD (must precede /:id)
router.get('/purchases', invController.getPurchases);
router.post('/purchases', invController.createPurchaseOrder);
router.get('/purchases/:id', invController.getPurchaseById);
router.put('/purchases/:id', invController.updatePurchaseOrder);
router.patch('/purchases/:id', invController.updatePurchaseOrder);
router.delete('/purchases/:id', invController.deletePurchaseOrder);
router.post('/purchases/:id/receive', invController.receivePurchaseOrder);

// Inventory items — full CRUD
router.get('/', invController.getInventory);
router.post('/', invController.createInventoryItem);
router.get('/:id', invController.getInventoryById);
router.put('/:id', invController.updateInventoryItem);
router.patch('/:id', invController.updateInventoryItem);
router.delete('/:id', invController.deleteInventoryItem);

export default router;
