import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const stockLedgerSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', index: true, required: true },

    // Source document
    docType: { type: String, enum: ['GRN', 'ISSUE', 'ADJUSTMENT'], required: true },
    docId: { type: Schema.Types.ObjectId, required: true },
    docNumber: { type: String },
    docDate: { type: Date, required: true },

    // Movement
    OpeningQty: { type: Number, default: 0 },
    receivedQty: { type: Number, default: 0 },
    IssuedQty: { type: Number, default: 0 },
    AdjustQty: { type: Number, default: 0 },
    unitCost: { type: Number, required: true },
    totalCost: { type: Number, required: true },

    // Running balances (snapshot after this line)
    balanceQty: { type: Number, required: true },
    balanceAvgCost: { type: Number, required: true },
  },
  { timestamps: true }
);

stockLedgerSchema.index({ account: 1, item: 1, createdAt: 1 });

export default model('StockLedger', stockLedgerSchema);