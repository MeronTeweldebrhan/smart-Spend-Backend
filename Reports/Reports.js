import JournalEntry from "../models/JournalEntry.js";
import ChartOfAccount from "../models/ChartofAccount.js";

export const getTrialBalance = async (req, res) => {
  try {
    const { accountId, startDate, endDate } = req.query;

    if (!accountId) return res.status(400).json({ error: "accountId is required" });

    // Aggregate debits and credits by account
    const pipeline = [
      { $match: { account: new mongoose.Types.ObjectId(accountId) } },
      { $unwind: "$lines" },
      {
        $lookup: {
          from: "chartofaccounts",
          localField: "lines.account",
          foreignField: "_id",
          as: "accountInfo",
        },
      },
      { $unwind: "$accountInfo" },
      // Date filter if provided
      ...(startDate || endDate
        ? [
            {
              $match: {
                date: {
                  ...(startDate ? { $gte: new Date(startDate) } : {}),
                  ...(endDate ? { $lte: new Date(endDate) } : {}),
                },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: "$accountInfo._id",
          accountName: { $first: "$accountInfo.name" },
          accountType: { $first: "$accountInfo.type" },
          debitSum: { $sum: "$lines.debit" },
          creditSum: { $sum: "$lines.credit" },
        },
      },
      {
        $project: {
          accountName: 1,
          accountType: 1,
          netBalance: { $subtract: ["$debitSum", "$creditSum"] },
        },
      },
      { $sort: { accountName: 1 } },
    ];

    const balances = await JournalEntry.aggregate(pipeline);

    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
