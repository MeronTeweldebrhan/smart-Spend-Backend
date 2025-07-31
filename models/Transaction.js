import mongoose from 'mongoose';
import { Schema,model } from 'mongoose';

const transactionSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["income","expense"],
    required: true,
  },
  description:{
    type:String,
    required:true
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  createdby:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Account',
  required: true,
},

},{ timestamps: true });

const Transaction = model("Transaction", transactionSchema);

export default Transaction;
