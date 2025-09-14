import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ReqLineSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 0 },
    remark: { type: String, trim: true },
  },
  { _id: false }
);

const storeReqSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    reqNumber: { type: String, required: true, trim: true },
    reqDate: { type: Date, default: Date.now },
    lines: { type: [ReqLineSchema], validate: v => v.length > 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_LEVEL_1', 'PENDING_LEVEL_2', 'PENDING_LEVEL_3', 'APPROVED', 'REJECTED', 'CLOSED'],
      default: 'DRAFT',
    },
    approvals: [
      {
        level: { type: Number, enum: [1, 2, 3], required: true },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date },
        status: { type: String, enum: ['APPROVED', 'REJECTED'], default: null },
        remarks: { type: String, trim: true },
      },
    ],
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    issues: [{ type: Schema.Types.ObjectId, ref: 'StoreIssue' }],
  },
  { timestamps: true }
);

storeReqSchema.index({ account: 1, reqNumber: 1 }, { unique: true });

export default model('StoreRequisition', storeReqSchema);