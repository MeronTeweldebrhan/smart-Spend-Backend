import express from "express";
import {
  createChartAccount,
  getChartAccounts,
  updateChartAccount,
  deleteChartAccount,
  getChartAccountsbyid,
} from "../controllers/chartofAccountController.js";
import {
  createSubType,
  getSubTypes,
  updateSubType,
  deleteSubType,
} from "../controllers/chartofAccount/SubTypeController.js"; // Import SubType controllers
import { authMiddleware } from "../utlis/auth.js";

const router = express.Router();

router.use(authMiddleware);

// SubType Routes
router.post("/subtypes", createSubType);
router.get("/subtypes", getSubTypes);
router.put("/subtypes/:id", updateSubType);
router.delete("/subtypes/:id", deleteSubType);

// ChartOfAccount Routes
router.post("/", createChartAccount);
router.get("/", getChartAccounts);
router.put("/:id", updateChartAccount);
router.delete("/:id", deleteChartAccount);
router.get("/:id", getChartAccountsbyid);



export default router;