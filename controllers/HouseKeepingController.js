import HousekeepingLog from "../models/HouseKeepingLog.js";
import HotelRoom from "../models/HotelRoom.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

export const logCleaning = async (req, res) => {
  try {
    const { account: accountId } = req.body;
    const userId = req.user._id;

    // Verify user has access to the account, the account is a 'hotel' type,
    // and the user has the 'housekeeping' permission.
    await verifyAccountAccess(userId, accountId, 'hotel', 'housekeeping');

    const log = new HousekeepingLog({ ...req.body, createdBy: userId });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/housekeeping/:accountId - Gets all cleaning logs for an account
export const getCleaningReport = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user._id;

    // Verify user has access to the account, the account is a 'hotel' type,
    // and the user has the 'housekeeping' permission.
    await verifyAccountAccess(userId, accountId, 'hotel', 'housekeeping');

    const logs = await HousekeepingLog.find({ account: accountId })
      .populate("room")
      .sort({ cleanedAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};