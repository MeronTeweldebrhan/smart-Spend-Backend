import express from "express";
import {
  createChartAccount,
  getChartAccounts,
  updateChartAccount,
  deleteChartAccount,
} from "../controllers/chartofAccountController.js"
import { authMiddleware } from "../utlis/auth.js";

const router =express.Router()

router.use(authMiddleware);

router.post('/',createChartAccount)
router.get('/',getChartAccounts)
router.put('/:id',updateChartAccount)
router.delete('/:id', deleteChartAccount)


export default router