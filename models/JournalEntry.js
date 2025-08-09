import mongoose from "mongoose";

const journalLineSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChartOfAccount",
    required: true,
  },
  type: {
    type: String,
    enum: ["debit", "credit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
});

const journalEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
    },
    lines: {
      type: [journalLineSchema],
      validate: [
        {
          validator: function (lines) {
            const debitTotal = lines
              .filter((l) => l.type === "debit")
              .reduce((sum, l) => sum + l.amount, 0);
            const creditTotal = lines
              .filter((l) => l.type === "credit")
              .reduce((sum, l) => sum + l.amount, 0);
            return debitTotal === creditTotal;
          },
          message: "Debits and credits must be equal.",
        },
        {
          validator: (lines) => lines.length >= 2,
          message: "A journal entry must have at least two line items.",
        },
      ],
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("JournalEntry", journalEntrySchema);
