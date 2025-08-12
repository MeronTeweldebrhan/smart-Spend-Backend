import JournalEntry from "../models/JournalEntry.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

export const createJournalEntry = async (req, res) => {
  try {
    const { date, description, accountId, lines } = req.body;
    const userId = req.user._id;

    // Initial validation for required fields
    if (!accountId || !lines || lines.length < 2) {
      return res.status(400).json({
        error:
          "Journal entry requires a valid accountId and at least two lines.",
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;

    // Validate each line individually (this is the missing logic)
    for (const line of lines) {
      // Check if an account is provided
      if (!line.account) {
        return res.status(400).json({ error: "Please select an account for all lines." });
      }

      // Ensure debit and credit are valid non-negative numbers
      const debitNum = parseFloat(line.debit);
      const creditNum = parseFloat(line.credit);

      if (isNaN(debitNum) || debitNum < 0 || isNaN(creditNum) || creditNum < 0) {
        return res.status(400).json({ error: "Amounts must be valid non-negative numbers." });
      }

      // Ensure exactly one of debit or credit is non-zero
      if (!((debitNum > 0 && creditNum === 0) || (creditNum > 0 && debitNum === 0))) {
        return res.status(400).json({ error: "Each line must have either debit or credit amount (not both)." });
      }

      totalDebit += debitNum;
      totalCredit += creditNum;
    }

    // Validate that total debits and credits match
    if (totalDebit !== totalCredit) {
      return res.status(400).json({
        error: "Total debit amount must equal total credit amount.",
      });
    }

    await verifyAccountAccess(req.user._id, accountId, ["personal", "hotel"], "journalEntries");

    const entry = await JournalEntry.create({
      date,
      description,
      lines: lines.map((line) => ({
        account: line.account,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
      account: accountId,
      createdby: userId,
    });

    const populatedEntry = await entry.populate("lines.account", "code name type");
    res.status(201).json(populatedEntry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getJournalEntries = async (req, res) => {
  try {
    const { accountId } = req.params;
    await verifyAccountAccess(req.user._id, accountId, ["personal", "hotel"], "journalEntries");

    const { type, chartAccountId, startDate, endDate } = req.query;

    const filters = { account: accountId };

    if (type) filters.type = type;

    if (chartAccountId) {
      filters["lines.account"] = chartAccountId;
    }

    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    // Removed filtering on lines.amount since model uses debit and credit fields instead

    const journalEntries = await JournalEntry.find(filters)
      .sort({ date: -1 })
      .populate("lines.account", "name code type")
      .populate("createdby", "username")
      .populate("account", "name");

    res.status(200).json(journalEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getJournalEntryById = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id)
      .populate("lines.account", "name code type") // ✅ correct population
      .populate("createdby", "username")
      .populate("account", "name");
    if (!entry)
      return res.status(404).json({ error: "Journal entry not found." });

    // Use the account field from entry for verification
    await verifyAccountAccess(req.user._id, entry.account, ["personal", "hotel"], "journalEntries");

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateJournalEntry = async (req, res) => {
  try {
    const { id: journalId } = req.params;
    const entry = await JournalEntry.findById(journalId);
    if (!entry)
      return res.status(404).json({ error: "Journal entry not found." });

    await verifyAccountAccess(req.user._id, entry.account, ["personal", "hotel"], "journalEntries");

    // Optional: You can re-validate debit = credit here if lines are updated

    Object.assign(entry, req.body);
    await entry.save();

    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteJournalEntry = async (req, res) => {
  try {
    const { id: journalId } = req.params;
    const entry = await JournalEntry.findById(journalId);
    if (!entry)
      return res.status(404).json({ error: "Journal entry not found." });

    await verifyAccountAccess(req.user._id, entry.account, ["personal", "hotel"], "journalEntries");

    await JournalEntry.findByIdAndDelete(journalId);
    res.json({ message: "Journal entry deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
