import { createCategory,getcategory,updateCategory,deleteCategory,getcategorybyid } from "../controllers/categoryController.js";
import express from 'express'
import { authMiddleware } from "../utlis/auth.js";

const router =express.Router()
router.use(authMiddleware)

router.post('/',createCategory)
router.get('/',getcategory)
router.put('/:id',updateCategory)
router.delete('/:id',deleteCategory)
router.get('/:id',getcategorybyid)



export default router