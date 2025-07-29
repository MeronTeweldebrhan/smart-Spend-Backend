import { createCategory,getcategory,updateCategory,deleteCategory } from "../controllers/categoryController.js";
import express from 'express'
import { authMiddleware } from "../utlis/auth.js";

const router =express.Router()
router.use(authMiddleware)

router.post('/',createCategory)
router.get('/',getcategory)
router.put('/:id',updateCategory)
router.delete('/:id',deleteCategory)



export default router