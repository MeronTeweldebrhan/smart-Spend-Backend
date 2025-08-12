// services/AccountingService.js
import JournalEntry from "../models/JournalEntry.js";
import ChartOfAccount from "../models/ChartofAccount.js";
import mongoose from "mongoose";

class AccountingService {
  /**
   * Creates a journal entry with debit/credit lines.
   */
  static async createJournalEntry({ date, description, accountId, lines, userId }) {
    // Validate total debits = credits with floating point tolerance
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new Error("Total debits must equal total credits.");
    }
    if (lines.length < 2) {
      throw new Error("At least two lines are required.");
    }

    // Validate all accounts belong to this accountId
    const accountIds = lines.map(l => l.accountId);
    const validAccounts = await ChartOfAccount.find({
      _id: { $in: accountIds },
      account: accountId
    });
    if (validAccounts.length !== lines.length) {
      throw new Error("One or more accounts are invalid for this company.");
    }

    // Map lines to schema
    const formattedLines = lines.map(l => ({
      account: l.accountId,
      debit: l.debit || 0,
      credit: l.credit || 0
    }));

    // Create and return journal entry
    const entry = await JournalEntry.create({
      date,
      description,
      lines: formattedLines,
      account: accountId,
      createdby: userId, // ✅ fixed casing
    });

    return entry.populate("lines.account", "code name type");
  }

  /**
   * Generates a Trial Balance for a given account within a date range.
   */
  static async getTrialBalance({ accountId, startDate, endDate }) {
    const filters = {
      account: new mongoose.Types.ObjectId(accountId),
    };

    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: filters },
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.account",
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" },
        },
      },
      {
        $lookup: {
          from: "chartofaccounts", // ✅ verify matches Mongo collection name
          localField: "_id",
          foreignField: "_id",
          as: "accountInfo"
        }
      },
      { $unwind: "$accountInfo" },
      {
        $project: {
          accountName: "$accountInfo.name",
          accountType: "$accountInfo.type",
          totalDebit: 1,
          totalCredit: 1,
          balance: { $subtract: ["$totalDebit", "$totalCredit"] }
        }
      },
      { $sort: { accountName: 1 } }
    ];

    return JournalEntry.aggregate(pipeline);
  }

  /**
   * Generates an Income Statement for a given account within a date range.
   */
  static async getIncomeStatement({ accountId, startDate, endDate }) {
    const reportAccounts = ["Revenue", "Expense"];

    const balances = await ChartOfAccount.aggregate([
      { $match: { account: new mongoose.Types.ObjectId(accountId), type: { $in: reportAccounts } } },
      {
        $lookup: {
          from: "journalentries", // ✅ verify name
          let: { chartAccountId: "$_id" },
          pipeline: [
            { $unwind: "$lines" },
            {
              $match: {
                $expr: { $eq: ["$lines.account", "$$chartAccountId"] },
                ...(startDate || endDate
                  ? {
                      date: {
                        ...(startDate ? { $gte: new Date(startDate) } : {}),
                        ...(endDate ? { $lte: new Date(endDate) } : {}),
                      }
                    }
                  : {})
              }
            },
            { $group: { _id: null, debitSum: { $sum: "$lines.debit" }, creditSum: { $sum: "$lines.credit" } } }
          ],
          as: "entryData"
        }
      },
      { $unwind: { path: "$entryData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          type: 1,
          debit: { $ifNull: ["$entryData.debitSum", 0] },
          credit: { $ifNull: ["$entryData.creditSum", 0] },
        }
      }
    ]);

    const revenue = balances
      .filter(b => b.type === "Revenue")
      .reduce((sum, b) => sum + (b.credit - b.debit), 0);
    const expenses = balances
      .filter(b => b.type === "Expense")
      .reduce((sum, b) => sum + (b.debit - b.credit), 0);
    const netIncome = revenue - expenses;

    return { revenue, expenses, netIncome, details: balances };
  }

  /**
   * Generates a Balance Sheet for a given account as of a specific date.
   */
  static async getBalanceSheet({ accountId, endDate }) {
    const reportAccounts = ["Asset", "Liability", "Equity"];

    const balances = await ChartOfAccount.aggregate([
      { $match: { account: new mongoose.Types.ObjectId(accountId), type: { $in: reportAccounts } } },
      {
        $lookup: {
          from: "journalentries", // ✅ verify
          let: { chartAccountId: "$_id" },
          pipeline: [
            { $unwind: "$lines" },
            {
              $match: {
                $expr: { $eq: ["$lines.account", "$$chartAccountId"] },
                date: { $lte: new Date(endDate) }
              }
            },
            { $group: { _id: null, debitSum: { $sum: "$lines.debit" }, creditSum: { $sum: "$lines.credit" } } }
          ],
          as: "entryData"
        }
      },
      { $unwind: { path: "$entryData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          type: 1,
          debit: { $ifNull: ["$entryData.debitSum", 0] },
          credit: { $ifNull: ["$entryData.creditSum", 0] },
        }
      }
    ]);

    const assets = balances.filter(b => b.type === "Asset");
    const liabilities = balances.filter(b => b.type === "Liability");
    const equity = balances.filter(b => b.type === "Equity");

    const totalAssets = assets.reduce((sum, b) => sum + (b.debit - b.credit), 0);
    const totalLiabilities = liabilities.reduce((sum, b) => sum + (b.credit - b.debit), 0);
    const totalEquity = equity.reduce((sum, b) => sum + (b.credit - b.debit), 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
  }
}

export default AccountingService;
