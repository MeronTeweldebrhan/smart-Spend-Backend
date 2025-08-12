import mongoose from "mongoose";

const HousekeepingLogSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  room: { type: mongoose.Schema.Types.ObjectId, ref: "HotelRoom", required: true },
  cleanedBy: { type: String, required: true }, // staff name
  cleanedAt: { type: Date, default: Date.now },
  notes: String
}, { timestamps: true });

export default mongoose.model("HousekeepingLog", HousekeepingLogSchema);
