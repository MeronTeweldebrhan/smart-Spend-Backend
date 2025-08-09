import mongoose from "mongoose";

const chartOfAccountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true }, // e.g., 1001 for Cash, 4001 for Sales
    name: { type: String, required: true, trim: true }, // e.g., Cash on Hand, Utilities Expense
    type: {
      type: String,
      enum: ["Asset", "Liability", "Equity", "Income", "Expense"],
      required: true,
    },
    description: { type: String },
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

export default mongoose.model("ChartOfAccount", chartOfAccountSchema);
