import AccountingService from "../services/AccountingService.js";
import ChartOfAccount from "../models/ChartofAccount.js";

export const recordCashPayment = async (req, res) => {
  try {
    const { amount, accountId, reservationId } = req.body;
    const userId = req.user._id;

    // 1. Lookup relevant accounts
    const cashAccount = await ChartOfAccount.findOne({ name: "Cash", account: accountId });
    const roomRevenueAccount = await ChartOfAccount.findOne({ name: "Room Revenue", account: accountId });

    if (!cashAccount || !roomRevenueAccount) {
      return res.status(400).json({ message: "Required chart of accounts not found." });
    }

    // 2. Create journal entry (DR Cash, CR Room Revenue)
    const journalEntry = await AccountingService.createJournalEntry({
      date: new Date(),
      description: `Cash payment for reservation ${reservationId}`,
      accountId,
      userId,
      lines: [
        { accountId: cashAccount._id, debit: amount, credit: 0 },
        { accountId: roomRevenueAccount._id, debit: 0, credit: amount },
      ],
    });

    // 3. Update reservation/payment logic here (not shown)

    res.status(201).json({ message: "Payment recorded and journal entry created", journalEntry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
