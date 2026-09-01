import { Router } from 'express';
import * as tableController from '../controllers/table.controller.js';

const router = Router();

router.get('/', tableController.getTables);
router.post('/', tableController.createTable);
router.patch('/:id/status', tableController.updateTableStatus);

export default router;
