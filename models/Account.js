import mongoose from 'mongoose'
import { Schema, model } from "mongoose";

const accountSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["personal", "family", "group"],
      default: "personal",
    },
    owner: { type: mongoose .Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Account = model("Account", accountSchema);
export default Account;
