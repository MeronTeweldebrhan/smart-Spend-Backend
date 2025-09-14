import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const supplierSchema = new Schema({
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  name: { type: String, required: true, trim: true },
  contactName: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

supplierSchema.index({ account: 1, name: 1 }, { unique: true });

export default model('Supplier', supplierSchema);