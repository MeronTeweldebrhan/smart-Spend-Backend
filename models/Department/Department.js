import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const departmentSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true }, // New: Description field
    manager: { type: Schema.Types.ObjectId, ref: 'User' }, // New: Department manager
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

departmentSchema.index({ account: 1, name: 1 }, { unique: true });

export default model('Department', departmentSchema);