import express from "express";
import { authMiddleware } from "../utlis/auth.js";
import {
  createRoom, getRooms, updateRoom, deleteRoom
} from "../controllers/HotelRoomController.js";
import {
  createReservation, getReservations, checkIn, checkOut, deleteReservation,getRoomsWithReservationInfo
} from "../controllers/ReservationController.js";
import {
  logCleaning, getCleaningReport
} from "../controllers/HouseKeepingController.js";
import { getRevenueReport } from "../controllers/RevenueReportController.js";

const router = express.Router();

// Room routes
router.post("/rooms", authMiddleware, createRoom);
router.get("/rooms/:accountId", authMiddleware, getRooms);
router.put("/rooms/:id", authMiddleware, updateRoom);
router.delete("/rooms/:id", authMiddleware, deleteRoom);

// Reservation routes
// Rooms route with reservation info
router.get("/rooms/:accountId", authMiddleware, getRoomsWithReservationInfo);
router.post("/reservations", authMiddleware, createReservation);
router.get("/reservations/", authMiddleware, getReservations);
router.patch("/reservations/:id/checkin", authMiddleware, checkIn);
router.patch("/reservations/:id/checkout", authMiddleware, checkOut);
router.delete("/reservations/:id", authMiddleware, deleteReservation);

// Housekeeping routes
router.post("/housekeeping", authMiddleware, logCleaning);
router.get("/housekeeping/:accountId", authMiddleware, getCleaningReport);

// Revenue report
router.get("/revenue/:accountId", authMiddleware, getRevenueReport);

export default router;
