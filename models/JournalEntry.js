// models/JournalEntry.js
import mongoose from "mongoose";

const journalLineSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChartOfAccount",
    required: true,
  },
  debit: {
    type: Number,
    default: 0,
    min: 0,
  },
  credit: {
    type: Number,
    default: 0,
    min: 0,
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
            const debitTotal = lines.reduce((sum, l) => sum + l.debit, 0);
            const creditTotal = lines.reduce((sum, l) => sum + l.credit, 0);
            return debitTotal === creditTotal;
          },
          message: "Debits and credits must be equal.",
        },
        {
          validator: (lines) => lines.length >= 2,
          message: "A journal entry must have at least two lines.",
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
