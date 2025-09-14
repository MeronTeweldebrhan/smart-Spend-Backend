import express from "express";
import { authMiddleware } from "../utlis/auth.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/Inventory/categoryController.js";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/Inventory/itemController.js";

import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receiveItems,
} from "../controllers/Inventory/poController.js";
import { createGRN, getGRNs, getGRNById } from '../controllers/Inventory/grnController.js';
import { 
    createStockLedger, 
    getStockLedgers, 
    getStockLedgerById, 
    updateStockLedger, 
    deleteStockLedger ,
    getStockBalances
} from "../controllers/Inventory/stockledgerController.js"; 

import {
  createStoreRequisition,
  getStoreRequisitions,
  getStoreRequisitionById,
  updateStoreRequisition,
} from '../controllers/Inventory/storeRequisitionController.js';
import { createStoreIssue, getStoreIssues } from '../controllers/Inventory/storeIssueController.js';
import { approveDocument } from "../controllers/Inventory/approvalController.js";
const router = express.Router();
router.use(authMiddleware);

// Category Routes
router.post("/categories", createCategory);
router.get("/categories", getCategories);
// router.get('/categories/tree', getCategoryTree);
router.get("/categories/:id", getCategoryById);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Item Routes
router.post("/items", createItem);
router.get("/items", getItems);
router.get("/items/:id", getItemById);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);

//PO Routes 
router.post('/purchase-orders', authMiddleware, createPurchaseOrder);
router.get('/purchase-orders', authMiddleware, getPurchaseOrders);
router.get('/purchase-orders/:id', authMiddleware, getPurchaseOrderById);
router.put('/purchase-orders/:id', authMiddleware, updatePurchaseOrder);
router.delete('/purchase-orders/:id', authMiddleware, deletePurchaseOrder);
router.post('/purchase-orders/:id/receive', authMiddleware, receiveItems);

//  GRN Routes 
router.post('/grn', createGRN);
router.get('/grn', getGRNs);
router.get('/grn/:id', getGRNById);

// Stock
router.post("/stock-ledgers", createStockLedger);
router.get("/stock-ledgers", getStockLedgers);
router.get("/stock-ledgers/balances", getStockBalances); 
router.get("/stock-ledgers/:id", getStockLedgerById);
router.put("/stock-ledgers/:id", updateStockLedger);
router.delete("/stock-ledgers/:id", deleteStockLedger);

// Store Requisition routes
router.post('/store-requisitions', createStoreRequisition);
router.get('/store-requisitions', getStoreRequisitions);
router.get('/store-requisitions/:id', getStoreRequisitionById);
router.patch('/store-requisitions/:id', updateStoreRequisition);

// Store Issue routes
router.post('/store-issues', createStoreIssue);
router.get('/store-issues', getStoreIssues);

//APProve route
router.post('/:documentType/:documentId/approve', approveDocument);
export default router;
