// routes/accountRoutes.js
import express from "express";
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  addEmployee, // New import
  updateEmployeePermissions, // New import
  removeEmployee, // New import
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

router.use((req, res, next) => {
    console.log(`Received ${req.method} request at path: ${req.originalUrl}`);
    next(); // Pass the request to the next handler
});
// Employee management routes
router.post("/:id/employees",  addEmployee);
router.put("/:id/employees/:employeeId",  updateEmployeePermissions);
router.delete("/:id/employees/:employeeId",  removeEmployee);

// Collaborator routes
router.post("/:id/collaborators", addCollaborator);
router.delete("/:id/collaborators/:userId", removeCollaborator);
router.get("/:id/collaborators", listCollaborators);

export default router;
