import mongoose from "mongoose";

const subTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., Current Asset, Fixed Asset
    type: {
      type: String,
      enum: ["Asset", "Liability", "Equity", "Revenue", "Expense"],
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SubType || mongoose.model('SubType', subTypeSchema);