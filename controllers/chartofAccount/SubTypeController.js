import { Types } from "mongoose"; // Add Mongoose for ObjectId validation
import SubType from "../../models/chartofaccounts/Subtype.js";
import ChartOfAccount from "../../models/ChartofAccount.js";
import { verifyAccountAccess } from "../../utlis/verifyOwnership.js";

const allowedTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"]; // Define allowed types

// Create SubType
export const createSubType = async (req, res) => {
  try {
    const { name, type, accountId } = req.body;
    const userId = req.user._id;

    if (!name || !type || !accountId) {
      return res.status(400).json({ message: "Name, type, and accountId are required." });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${allowedTypes.join(", ")}` });
    }

    if (!Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid accountId format." });
    }

    await verifyAccountAccess(userId, accountId, ["personal", "hotel"], "subtypes");

    const existing = await SubType.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      type,
      account: accountId,
    });

    if (existing) {
      return res.status(409).json({ message: `SubType '${name}' already exists for this type.` });
    }

    const newSubType = await SubType.create({
      name: name.trim(),
      type,
      account: accountId,
      createdby: userId,
    });

    res.status(201).json(newSubType);
  } catch (error) {
    console.error("Error in createSubType:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create subtype." });
  }
};

// Get all SubTypes for an account
export const getSubTypes = async (req, res) => {
  try {
    const { accountId, type } = req.query; // Add type as query parameter
    const userId = req.user._id;

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required." });
    }

    if (!Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid accountId format." });
    }

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${allowedTypes.join(", ")}` });
    }

    await verifyAccountAccess(userId, accountId, ["personal", "hotel"], "subtypes");

    const query = { account: accountId };
    if (type) {
      query.type = type; // Filter by type if provided
    }

    const subTypes = await SubType.find(query).sort({ type: 1, name: 1 });
    console.log("SubTypes fetched:", subTypes);
    res.status(200).json(subTypes);
  } catch (error) {
    console.error("Error in getSubTypes:", error);
    res.status(500).json({ message: "Failed to fetch subtypes." });
  }
};

// Update SubType
export const updateSubType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const userId = req.user._id;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subtype ID format." });
    }

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required." });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${allowedTypes.join(", ")}` });
    }

    await verifyAccountAccess(userId, req.user.account, ["personal", "hotel"], "subtypes");

    const existing = await SubType.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      type,
      account: req.user.account,
      _id: { $ne: id }, // Exclude the current subtype
    });

    if (existing) {
      return res.status(409).json({ message: `SubType '${name}' already exists for this type.` });
    }

    const updated = await SubType.findOneAndUpdate(
      { _id: id, account: req.user.account },
      { name: name.trim(), type },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "SubType not found." });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateSubType:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update subtype." });
  }
};

// Delete SubType
export const deleteSubType = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subtype ID format." });
    }

    await verifyAccountAccess(userId, req.user.account, ["personal", "hotel"], "subtypes");

    const subType = await SubType.findOne({ _id: id, account: req.user.account });

    if (!subType) {
      return res.status(404).json({ message: "SubType not found." });
    }

    const linkedAccounts = await ChartOfAccount.countDocuments({ subtype: id });
    if (linkedAccounts > 0) {
      return res.status(400).json({
        message: `Cannot delete '${subType.name}' because it is linked to ${linkedAccounts} account(s).`,
      });
    }

    const result = await SubType.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "SubType not found." });
    }

    res.json({ message: "SubType deleted successfully." });
  } catch (error) {
    console.error("Error in deleteSubType:", error);
    res.status(500).json({ message: "Failed to delete subtype." });
  }
};