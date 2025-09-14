import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const POLineSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    description: { type: String, trim: true },
    qty: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    TotalPrice: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, default: 0 },
  },
  { _id: false }
);

// Pre-save hook to calculate TotalPrice for each line
POLineSchema.pre('validate', function(next) {
  this.TotalPrice = this.qty * this.unitPrice;
  next();
});

const purchaseOrderSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    poNumber: { type: String, required: true, trim: true },
    poDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'], default: 'DRAFT' },
    lines: { type: [POLineSchema], validate: v => v.length > 0 },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual to calculate total for the entire PO
purchaseOrderSchema.virtual('total').get(function() {
  return this.lines ? this.lines.reduce((sum, line) => sum + (line.TotalPrice || 0), 0) : 0;
});

purchaseOrderSchema.index({ account: 1, poNumber: 1 }, { unique: true });

export default model('PurchaseOrder', purchaseOrderSchema);