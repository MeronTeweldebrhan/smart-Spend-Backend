import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ReceivedLineSchema = new Schema(
    {
        item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
        quantityReceived: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const grnSchema = new Schema(
    {
        account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
        grnNumber: { type: String, required: true, trim: true, unique: true },
        purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
        receivedDate: { type: Date, default: Date.now },
        lines: { type: [ReceivedLineSchema], validate: v => v.length > 0 },
        notes: String,
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

grnSchema.index({ account: 1, grnNumber: 1 }, { unique: true });

export default model('GRN', grnSchema);