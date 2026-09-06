import { Router } from 'express';
import * as branchController from '../controllers/branch.controller.js';

const router = Router();

router.get('/', branchController.getBranches);
router.post('/', branchController.createBranch);
router.get('/:id', branchController.getBranchById);
router.put('/:id', branchController.updateBranch);
router.patch('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

export default router;
