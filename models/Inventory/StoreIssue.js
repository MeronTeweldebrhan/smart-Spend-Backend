import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const IssueLineSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    reqId: { type: Schema.Types.ObjectId, ref: 'StoreRequisition' },
  },
  { _id: false }
);

const storeIssueSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    issueNumber: { type: String, required: true, trim: true },
    issueDate: { type: Date, default: Date.now },
    requisition: { type: Schema.Types.ObjectId, ref: 'StoreRequisition' },
    lines: { type: [IssueLineSchema], validate: v => v.length > 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_LEVEL_1', 'PENDING_LEVEL_2', 'PENDING_LEVEL_3', 'APPROVED', 'REJECTED'],
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
  },
  { timestamps: true }
);

storeIssueSchema.index({ account: 1, issueNumber: 1 }, { unique: true });

export default model('StoreIssue', storeIssueSchema);