// services/AccountingService.js
import JournalEntry from "../models/JournalEntry.js";
import ChartOfAccount from "../models/ChartofAccount.js";

class AccountingService {
  /**
   * Creates a journal entry with debit/credit lines.
   * @param {Object} params
   * @param {Date} params.date
   * @param {String} params.description
   * @param {String} params.accountId - the company/account this entry belongs to
   * @param {Array} params.lines - [{ accountId, debit, credit }]
   * @param {String} params.userId - user creating this entry
   * @returns created JournalEntry document
   */
  static async createJournalEntry({ date, description, accountId, lines, userId }) {
    // Validate total debits = credits
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (totalDebit !== totalCredit) {
      throw new Error("Total debits must equal total credits.");
    }
    if (lines.length < 2) {
      throw new Error("At least two lines are required.");
    }

    // Optional: Validate all accounts belong to this accountId
    const accountIds = lines.map(l => l.accountId);
    const validAccounts = await ChartOfAccount.find({ _id: { $in: accountIds }, account: accountId });
    if (validAccounts.length !== lines.length) {
      throw new Error("One or more accounts are invalid for this company.");
    }

    // Map lines to schema
    const formattedLines = lines.map(l => ({
      account: l.accountId,
      debit: l.debit || 0,
      credit: l.credit || 0,
    }));

    // Create and return journal entry
    const entry = await JournalEntry.create({
      date,
      description,
      lines: formattedLines,
      account: accountId,
      createdby: userId,
    });

    return entry.populate("lines.account", "code name type");
  }
}

export default AccountingService;
