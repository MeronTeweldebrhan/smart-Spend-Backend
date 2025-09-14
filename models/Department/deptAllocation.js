import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const deptAllocationSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', index: true, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true, required: true },
    issue: { type: Schema.Types.ObjectId, ref: 'StoreIssue', required: true },
    requisition: { type: Schema.Types.ObjectId, ref: 'StoreRequisition' },
    item: { type: Schema.Types.ObjectId, ref: 'Item', index: true, required: true },
    qty: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    issueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

deptAllocationSchema.pre('save', function (next) {
  this.totalCost = this.qty * this.unitCost;
  next();
});

deptAllocationSchema.index({ account: 1, department: 1, item: 1, issueDate: 1 });

export default model('DepartmentAllocation', deptAllocationSchema);