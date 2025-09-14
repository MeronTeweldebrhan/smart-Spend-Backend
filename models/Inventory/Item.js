import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const itemSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, index: true },
    uom: { 
      type: String, 
      enum: ['EA', 'KG', 'LT', 'M', 'BOX', 'PACK'],
      default: 'EA',
      required: true 
    },
    category: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true 
    },
    description: { type: String, trim: true },
    barcode: { type: String, trim: true, index: true },
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    onHandQty: { type: Number, default: 0, min: 0 },
    avgCost: { type: Number, default: 0, min: 0 },
    minQty: { type: Number, default: 0, min: 0 },
    reorderQty: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

itemSchema.index({ account: 1, name: 1 }, { unique: true });
itemSchema.index({ account: 1, sku: 1 }, { unique: true, sparse: true });
itemSchema.index({ account: 1, barcode: 1 }, { unique: true, sparse: true });

// Prevent model overwrite
export default mongoose.models.Item || model('Item', itemSchema);