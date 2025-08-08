import mongoose from "mongoose";
import { Schema, model } from "mongoose";


const employeeUserSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "employee" },
    permissions: {
      transactions: { type: Boolean, default: false },
      invoices: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      clients: { type: Boolean, default: false },
      categories: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    },
  },
  { _id: true }
);

const accountSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["personal", "Family","Business", "Group", "hotel"],
      default: "personal",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    employeeUsers: [employeeUserSchema],
  },
  
  { timestamps: true }
);



const Account = model("Account", accountSchema);
export default Account;
