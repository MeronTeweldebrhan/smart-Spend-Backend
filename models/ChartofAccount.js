import mongoose from "mongoose";

const chartOfAccountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true }, // e.g., 1001 for Cash, 4001 for Sales
    name: { type: String, required: true, trim: true }, // e.g., Cash on Hand, Utilities Expense
    type: {
      type: String,
      enum: ["Asset", "Liability", "Equity", "Revenue", "Expense"],
      required: true,
    },
    subtype: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubType",
      required: false, // Optional field
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
        balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);
// Prevent model overwrite by checking if model exists
export default mongoose.models.ChartOfAccount || mongoose.model('ChartOfAccount', chartOfAccountSchema);
