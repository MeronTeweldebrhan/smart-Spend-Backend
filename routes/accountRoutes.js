// routes/accountRoutes.js
import express from "express";
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  addCollaborator,
  removeCollaborator,
  listCollaborators,
  getAccountById
} from "../controllers/AccountController.js";
import { authMiddleware } from "../utlis/auth.js";

const router = express.Router();

router.use(authMiddleware);

// Account routes
router.post("/", createAccount);
router.get("/", getAccounts);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);
router.get("/:id",getAccountById)

// Collaborator routes
router.post("/:id/collaborators", addCollaborator);
router.delete("/:id/collaborators/:userId", removeCollaborator);
router.get("/:id/collaborators", listCollaborators);

export default router;
