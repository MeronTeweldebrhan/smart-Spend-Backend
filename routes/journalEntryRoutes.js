import express from "express";
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
} from "../controllers/journalEntryController.js";
import { authMiddleware } from "../utlis/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/",  createJournalEntry);
router.get("/account/:accountId", getJournalEntries);
router.get("/:id",  getJournalEntryById);
router.put("/:id",  updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

export default router;
