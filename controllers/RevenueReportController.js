import Reservation from "../models/Reservation.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

export const getRevenueReport = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    await verifyAccountAccess(req.user._id, accountId, 'hotel', 'reservations');

    const reservations = await Reservation.find({
      account: req.params.accountId,
      status: "CheckedOut",
      checkOutDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    res.json({ totalRevenue, count: reservations.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
