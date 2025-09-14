import express from 'express'
import AccountingService from '../services/AccountingService.js';
const router=express.Router()
router.get("/trial-balance", async (req, res) => {
     try {
 const reports = await AccountingService.getTrialBalance(req.query);
 res.json(reports);
} catch (error) {
    res.status(500).json({ error: error.message });}
});

router.get("/income-statement", async (req, res) => {
     try {
 const reports = await AccountingService.getIncomeStatement(req.query);
 res.json(reports);
} catch (error) {
    res.status(500).json({ error: error.message });}
});

router.get("/balance-sheet", async (req, res) => {
     try {
 const reports = await AccountingService.getBalanceSheet(req.query);
 res.json(reports);
} catch (error) {
    res.status(500).json({ error: error.message });}
});
// ✅ NEW Cash Flow endpoint
router.get("/cash-flow", async (req, res) => {
  try {
    const reports = await AccountingService.getCashFlow(req.query);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router