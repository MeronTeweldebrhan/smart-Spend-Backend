import JournalEntry from "../models/JournalEntry.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

export const createJournalEntry = async (req, res) => {
  try {
    const { date, description, accountId, lines } = req.body;
    const userId = req.user._id;

    // Add necessary backend validation
    if (!accountId || !lines || lines.length < 2) {
      return res.status(400).json({
        error: "Journal entry requires a valid accountId and at least two lines.",
      });
    }

    await verifyAccountAccess(userId, accountId);

    // ✅ The payload is correctly structured in your frontend
    //    Here we destructure it and use it to create the entry.
    const entry = await JournalEntry.create({
      date,
      description,
      lines,
      account: accountId, // 
      createdby: userId, // 
    });
   const  populatedentry = await entry.populate("lines.account", "code name type");
    res.status(201).json(populatedentry);
  } catch (err) {
    // Return a more user-friendly error message
    res.status(400).json({ error: err.message });
  }
};

///===Get transaction all with filters===///
export const getJournalEntries = async (req, res) => {
  try {
    const { accountId } = req.params;
    await verifyAccountAccess(req.user._id, accountId);

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
    const entry = await JournalEntry.findById(req.params.id).populate("lines.account");
    if (!entry) return res.status(404).json({ error: "Journal entry not found." });

    await verifyAccountAccess(req.user._id, entry.account);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Journal entry not found." });

    await verifyAccountAccess(req.user._id, entry.account);

    Object.assign(entry, req.body);
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Journal entry not found." });

    await verifyAccountAccess(req.user._id, entry.account);

    await entry.remove();
    res.json({ message: "Journal entry deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
