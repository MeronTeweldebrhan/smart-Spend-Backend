import mongoose from "mongoose";

const HotelRoomSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  roomNumber: { type: String, required: true },
  type: { type: String, required: true }, // Single, Double, Suite
  rate: { type: Number, required: true },
  status: { type: String, default: "Available" }, // Available, Occupied, Maintenance
  description: String
}, { timestamps: true });

export default mongoose.model("HotelRoom", HotelRoomSchema);
