import ChartOfAccount from "../models/ChartofAccount.js";
import SubType from "../models/chartofaccounts/Subtype.js";
import mongoose from "mongoose";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";
import JournalEntry from "../models/JournalEntry.js";
import { generateAccountCode } from "../utlis/generateAccountCode.js";

// Create
export const createChartAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, type, description, accountId, subtype } = req.body;
    const userId = req.user._id;

    if (!name || !type || !accountId) {
      return res
        .status(400)
        .json({ message: "Name, type, and accountId are required." });
    }

    await verifyAccountAccess(userId, accountId, ["personal", "hotel"], "chartofaccounts");

    const existing = await ChartOfAccount.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      createdby: userId,
      account: accountId,
    }).session(session);

    if (existing) {
      return res
        .status(409)
        .json({ message: `ChartOfAccount '${name}' already exists.` });
    }

    // Validate subtype if provided
    let subtypeId = subtype;
    if (subtype) {
      const subTypeDoc = await SubType.findById(subtype).session(session);
      if (!subTypeDoc || subTypeDoc.type !== type || subTypeDoc.account.toString() !== accountId) {
        return res.status(400).json({ message: "Invalid subtype for this account or type." });
      }
      subtypeId = subTypeDoc._id;
    }

    // Auto-increment codeNumber logic
    const code = await generateAccountCode({ accountId, type, session });

    // Create new chart of account
    const newAccount = await ChartOfAccount.create(
      [
        {
          code,
          name: name.trim(),
          type,
          subtype: subtypeId,
          description,
          account: accountId,
          createdby: userId,
        },
      ],
      { session }
    );

    // Populate before sending back
    const populatedChartOfAccount = await ChartOfAccount.findById(newAccount[0]._id)
      .populate("createdby", "username")
      .populate("account", "name")
      .populate("subtype", "name")
      .session(session);

    await session.commitTransaction();
    res.status(201).json(populatedChartOfAccount);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating ChartOfAccount:", error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Get all (for current user’s account)
export const getChartAccounts = async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const userId = req.user._id;
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    await verifyAccountAccess(userId, accountId, ["personal", "hotel"], "chartofaccounts");

    const typeOrder = {
      Asset: 1,
      Liability: 2,
      Expense: 3,
      Revenue: 4,
      Equity: 5,
    };

    const accounts = await ChartOfAccount.find({ account: accountId })
      .populate("createdby", "username")
      .populate("account", "name")
      .populate("subtype", "name")
      .sort({ type: 1 });

    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const journalEntries = await JournalEntry.aggregate([
          {
            $match: {
              account: new mongoose.Types.ObjectId(accountId),
              "lines.account": new mongoose.Types.ObjectId(account._id),
            },
          },
          {
            $unwind: "$lines",
          },
          {
            $match: {
              "lines.account": new mongoose.Types.ObjectId(account._id),
            },
          },
          {
            $group: {
              _id: null,
              totalDebit: { $sum: "$lines.debit" },
              totalCredit: { $sum: "$lines.credit" },
            },
          },
        ]);

        const balance =
          journalEntries.length > 0
            ? journalEntries[0].totalDebit - journalEntries[0].totalCredit
            : 0;

        return {
          ...account.toObject(),
          balance,
        };
      })
    );

    const sortedAccounts = accountsWithBalance.sort((a, b) => {
      return typeOrder[a.type] - typeOrder[b.type];
    });

    res.status(200).json(sortedAccounts);
  } catch (error) {
    console.error("Error fetching ChartOfAccounts:", error);
    res.status(500).json({ error: error.message });
  }
};
///===Get Single Chartofaccount===///
export const getChartAccountsbyid = async (req, res) => {
  try {
    const { id: coaId } = req.params;

    const coa = await ChartOfAccount.findById(coaId);
    if (!coa) throw new Error("Chart of account not found");

    await verifyAccountAccess(req.user._id, coa.account, ["personal", "hotel"], "chartofaccounts");

    // Calculate balance from journal entries
    const journalEntries = await JournalEntry.aggregate([
      {
        $match: {
          account: new mongoose.Types.ObjectId(coa.account),
          "lines.account": new mongoose.Types.ObjectId(coa._id),
        },
      },
      { $unwind: "$lines" },
      {
        $match: {
          "lines.account": new mongoose.Types.ObjectId(coa._id),
        },
      },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" },
        },
      },
    ]);

    const balance =
      journalEntries.length > 0
        ? journalEntries[0].totalDebit - journalEntries[0].totalCredit
        : 0;

    const populated = await ChartOfAccount.findById(coaId)
      .populate("createdby", "username")
      .populate("account", "name");

    res.json({
      ...populated.toObject(),
      balance,
    });
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
};

// Update
export const updateChartAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the document
    const updated = await ChartOfAccount.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Chart of account not found" });
    }

    await verifyAccountAccess(
      req.user._id,
      updated.account,
      ["personal", "hotel"],
      "chartofaccounts"
    );

    // Calculate balance from journal entries
    const journalEntries = await JournalEntry.aggregate([
      {
        $match: {
          account: new mongoose.Types.ObjectId(updated.account),
          "lines.account": new mongoose.Types.ObjectId(updated._id),
        },
      },
      { $unwind: "$lines" },
      {
        $match: {
          "lines.account": new mongoose.Types.ObjectId(updated._id),
        },
      },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" },
        },
      },
    ]);

    const balance =
      journalEntries.length > 0
        ? journalEntries[0].totalDebit - journalEntries[0].totalCredit
        : 0;

    // Repopulate for consistency
    const populated = await ChartOfAccount.findById(updated._id)
      .populate("createdby", "username")
      .populate("account", "name")
      .populate("subtype", "name");

    res.status(200).json({
      ...populated.toObject(),
      balance,
    });
  } catch (error) {
    console.error("Error updating chart of account:", error);
    res.status(500).json({ error: error.message });
  }
};


// Delete
export const deleteChartAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const coa = await ChartOfAccount.findOne({ _id: id, account: req.user.account });
    if (!coa) {
      return res.status(404).json({ message: "Chart of account not found" });
    }

    await verifyAccountAccess(req.user._id, coa.account, ["personal", "hotel"], "chartofaccounts");

    const linkedTransactionsCount = await JournalEntry.countDocuments({
      account: req.user.account,
      "lines.account": id
    });

    if (linkedTransactionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete "${coa.name}" because it has ${linkedTransactionsCount} linked transaction(s) please delete those transaction first!!.`
      });
    }

    await ChartOfAccount.deleteOne({ _id: id });
    res.json({ message: "Chart of account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting chart of account" });
  }
};

