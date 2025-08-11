import Reservation from "../models/Reservation.js";
import HotelRoom from "../models/HotelRoom.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

export const createReservation = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, account } = req.body;

     // Verify access, account type, and 'reservations' permission
    await verifyAccountAccess(req.user._id, account, 'hotel', 'reservations');

    // Check for overlapping reservations in the same room
    const overlapping = await Reservation.findOne({
      room,
      account,
      $or: [
        { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } }
      ],
      status: { $in: ["Booked", "CheckedIn"] } // consider booked or checked in as unavailable
    });

    if (overlapping) {
      return res.status(409).json({ message: "Room is already booked for the selected dates." });
    }

    const reservation = new Reservation({
      ...req.body,
      createdBy: req.user._id,
      status: "Booked", // default status on create
    });

    await reservation.save();

    // Optionally update room status to Booked (if you want immediate reflect)
    const roomDoc = await HotelRoom.findById(room);
    if (roomDoc.status === "Available") {
      roomDoc.status = "Booked";
      await roomDoc.save();
    }

    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


export const getReservations = async (req, res) => {
  try {
    const accountId = req.query.account;
    // Verify access, account type, and 'reservations' permission
    await verifyAccountAccess(req.user._id, accountId, 'hotel', 'reservations');

    const reservations = await Reservation.find({ account: accountId })
      .populate("room");

    res.json(reservations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("room").populate("account");
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    
    // Verify access, account type, and 'reservations' permission
    await verifyAccountAccess(req.user._id, reservation.account, 'hotel', 'reservations');
     // Check if today is the same as or after the check-in date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to midnight

    const checkInDate = new Date(reservation.checkInDate);
    checkInDate.setHours(0, 0, 0, 0); // Normalize time to midnight

    if (today < checkInDate) {
      return res.status(400).json({ message: "Cannot check in before the check-in date" });
    }

    reservation.status = "CheckedIn";
    reservation.room.status = "Occupied";

    await reservation.save();
    await reservation.room.save();

    res.json({ message: "Guest checked in", reservation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("room");
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    
    // Verify access, account type, and 'reservations' permission
    await verifyAccountAccess(req.user._id, reservation.account, 'hotel', 'reservations');

    reservation.status = "CheckedOut";
    reservation.room.status = "Available";

    await reservation.save();
    await reservation.room.save();

    res.json({ message: "Guest checked out", reservation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    // Verify access, account type, and 'reservations' permission
    await verifyAccountAccess(req.user._id, reservation.account, 'hotel', 'reservations');
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    await reservation.deleteOne();
    res.json({ message: "Reservation deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getRoomsWithReservationInfo = async (req, res) => {
  try {
    const { accountId } = req.params;
    // if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
    //   return res.status(400).json({ error: "Invalid accountId" });
    // }
// Verify access, account type, and 'reservations' permission
    await verifyAccountAccess(req.user._id, accountId, 'hotel', 'reservations');
    const rooms = await HotelRoom.find({ account: accountId });
    const today = new Date();

    // Map rooms with current reservation info
    const roomsWithReservationInfo = await Promise.all(
      rooms.map(async (room) => {
        // Find active reservation overlapping today (Booked or CheckedIn)
        const reservation = await Reservation.findOne({
          room: room._id,
          account: accountId,
          status: { $in: ["Booked", "CheckedIn"] },
          checkInDate: { $lte: today },
          checkOutDate: { $gte: today },
        });

        return {
          ...room.toObject(),
          guestName: reservation?.guestName || null,
          checkInDate: reservation?.checkInDate || null,
          checkOutDate: reservation?.checkOutDate || null,
          paymentStatus: reservation?.paymentStatus || null,
        };
      })
    );

    res.json(roomsWithReservationInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching rooms" });
  }
};