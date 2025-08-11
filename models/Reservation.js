import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  guestName: { type: String, required: true },
  guestEmail: String,
  guestPhone: String,

  room: { type: mongoose.Schema.Types.ObjectId, ref: "HotelRoom", required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  
  status: { type: String, default: "Booked" }, // Booked, CheckedIn, CheckedOut, Cancelled
  paymentStatus: { type: String, default: "Pending" }, // Pending, Paid
  totalAmount: Number
}, { timestamps: true });

export default mongoose.model("Reservation", ReservationSchema);
