import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '.././controllers/Department/DepartmentController.js';
import { getDepartmentAllocations, getDepartmentAllocationById } from '.././controllers/Department/deptAllocationController.js';
import { authMiddleware } from "../utlis/auth.js";

const router = express.Router();

// Crete department s route
router.use(authMiddleware);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', createDepartment);
router.patch('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

// Department Allocation routes
router.get('/department-allocations', getDepartmentAllocations);
router.get('/department-allocations/:id', getDepartmentAllocationById);

export default router;