import ChartOfAccount from "../models/ChartofAccount.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";
// Create
export const createChartAccount = async (req, res) => {
  try {
    const { name, type, description, accountId } = req.body;
    const userId = req.user._id;

    if (!name || !type || !accountId) {
      return res.status(400).json({ message: "Name, type, and accountId are required." });
    }

    // ✅ Verify account access
    await verifyAccountAccess(userId, accountId);

    // ✅ Check if account already exists for this accountId
    const existing = await ChartOfAccount.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      createdby: userId,
      account: accountId
    });

    if (existing) {
      return res.status(409).json({ message: `ChartOfAccount '${name}' already exists.` });
    }

    // ✅ Auto-increment codeNumber logic
    const allAccounts = await ChartOfAccount.find({ account: accountId }).select("code").lean();

    const nextCode = allAccounts.length > 0
      ? allAccounts.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10))
          .pop().code + 1
      : 1000;

    // ✅ Create new chart of account
    const newAccount = await ChartOfAccount.create({
      name: name.trim(),
      type,
      code: nextCode.toString(),
      description,
      createdby: userId,
      account: accountId
    });

    // ✅ Populate before sending back
    const populatedChartOfAccount = await ChartOfAccount.findById(newAccount._id)
      .populate("createdby", "username")
      .populate("account", "name");

    res.status(201).json(populatedChartOfAccount);

  } catch (error) {
    console.error("Error creating ChartOfAccount:", error);
    res.status(500).json({ message: error.message });
  }
};



// Get all (for current user’s account)
export const getChartAccounts = async (req, res) => {
  try {
    // Correctly get accountId from the URL query parameters
    const accountId = req.query.accountId;

    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    // You can keep this line to verify access
    await verifyAccountAccess(req.user._id, accountId);

    const accounts = await ChartOfAccount.find({ account: accountId })
      .populate("createdby", "username")
      .populate("account", "name");

    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update
export const updateChartAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ChartOfAccount.findOneAndUpdate(
      { _id: id, account: req.user.account },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete
export const deleteChartAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ChartOfAccount.findOneAndDelete({
      _id: id,
      account: req.user.account,
    });
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
