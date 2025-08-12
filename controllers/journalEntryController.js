import JournalEntry from "../models/JournalEntry.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

export const createJournalEntry = async (req, res) => {
  try {
    const { date, description, accountId, lines } = req.body;
    const userId = req.user._id;

    // Add necessary backend validation
    if (!accountId || !lines || lines.length < 2) {
      return res.status(400).json({
        error:
          "Journal entry requires a valid accountId and at least two lines.",
      });
    }

    await verifyAccountAccess(
      req.user._id,
      accountId,
      ["personal", "hotel"],
      "journalEntries"
    );
    // Validate total debits equal total credits
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce(
      (sum, line) => sum + (line.credit || 0),
      0
    );
    if (totalDebit !== totalCredit) {
      return res.status(400).json({
        error: "Total debit amount must equal total credit amount.",
      });
    }
    // ✅ The payload is correctly structured in your frontend
    //    Here we destructure it and use it to create the entry.
    const entry = await JournalEntry.create({
      date,
      description,
      lines,
      account: accountId, //
      createdby: userId, //
    });
    const populatedentry = await entry
      .populate("lines.account", "name code type") // ✅ correct population
      .populate("createdby", "username")
      .populate("account", "name");
    res.status(201).json(populatedentry);
  } catch (err) {
    // Return a more user-friendly error message
    res.status(400).json({ error: err.message });
  }
};

///===Get Journal  all with filters===///
export const getJournalEntries = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    await verifyAccountAccess(
      req.user._id,
      accountId,
      ["personal", "hotel"],
      "journalEntries"
    );

    const {
      type,
      chartAccountId, // better naming instead of ChartOfAccount
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = req.query;

    const filters = { account: accountId };

    if (type) filters.type = type;

    // Filter by a specific chart account inside the lines array
    if (chartAccountId) {
      filters["lines.account"] = chartAccountId;
    }

    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filters["lines.amount"] = {};
      if (minAmount) filters["lines.amount"].$gte = Number(minAmount);
      if (maxAmount) filters["lines.amount"].$lte = Number(maxAmount);
    }

    const journalEntries = await JournalEntry.find(filters)
      .sort({ date: -1 })
      .populate("lines.account", "name code type") // ✅ correct population
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

    await verifyAccountAccess(
      req.user._id,
      entry.account,
      ["personal", "hotel"],
      "journalEntries"
    );
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

    await verifyAccountAccess(
      req.user._id,
      entry.account,
      ["personal", "hotel"],
      "journalEntries"
    );

    const updated = await JournalEntry.findByIdAndUpdate(journalId, req.body, {
      new: true,
    })
      .populate("lines.account", "name code type") // ✅ correct population
      .populate("createdby", "username")
      .populate("account", "name");

    res.json(updated);
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

    await verifyAccountAccess(
      req.user._id,
      entry.account,
      ["personal", "hotel"],
      "journalEntries"
    );

    await JournalEntry.findByIdAndDelete(journalId);
    res.json({ message: "Journal entry deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
