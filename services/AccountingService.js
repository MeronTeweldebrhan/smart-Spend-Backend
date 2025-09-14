// services/AccountingService.js
import JournalEntry from "../models/JournalEntry.js";
import ChartOfAccount from "../models/ChartofAccount.js";
import mongoose from "mongoose";

class AccountingService {
  
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
 * Generates a Cash Flow Statement for a given account within a date range.
 */
static async getCashFlow({ accountId, startDate, endDate }) {
  // Get Net Income from Income Statement
  const incomeStatement = await this.getIncomeStatement({ accountId, startDate, endDate });

  // Get Balance Sheet at start & end dates
  const openingBS = await this.getBalanceSheet({ accountId, endDate: startDate });
  const closingBS = await this.getBalanceSheet({ accountId, endDate });

  // Changes in balance sheet accounts
  const deltaAssets = closingBS.totalAssets - openingBS.totalAssets;
  const deltaLiabilities = closingBS.totalLiabilities - openingBS.totalLiabilities;
  const deltaEquity = closingBS.totalEquity - openingBS.totalEquity;

  return {
    netIncome: incomeStatement.netIncome,
    operatingActivities: incomeStatement.netIncome + deltaLiabilities - deltaAssets,
    investingActivities: 0, // extend later if you want to track fixed assets separately
    financingActivities: deltaEquity,
    netCashFlow: incomeStatement.netIncome + deltaLiabilities - deltaAssets + deltaEquity,
    details: {
      openingCash: openingBS.totalAssets, // naive: treat all assets as cash
      closingCash: closingBS.totalAssets,
    }
  };
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
