// controllers/AccountController.js
import Account from "../models/Account.js";
import User from "../models/User.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

// Create a new account
export const createAccount = async (req, res) => {
  try {
    const { name, type } = req.body;

    const newAccount = await Account.create({
      name,
      type,
      owner: req.user._id,
      collaborators: [],
    });

    res.status(201).json(newAccount);
  } catch (err) {
    console.error("Account creation failed:", err);
    res.status(400).json({ message: err.message });
  }
};

// Get all accounts owned or shared with the user
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .populate("owner", "username")
      .populate("collaborators", "username email");

    res.json(accounts);
  } catch (err) {
    console.error("Failed to fetch accounts:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update account name or type (only owner)
export const updateAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    await verifyAccountAccess(req.user._id, accountId);

    const updated = await Account.findByIdAndUpdate(accountId, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("Account update failed:", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete account (only owner)
export const deleteAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    await verifyAccountAccess(req.user._id, accountId);

    await Account.findByIdAndDelete(accountId);

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add collaborator by email (only owner)
export const addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    const accountId = req.params.id;

    await verifyAccountAccess(req.user._id, accountId);

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = await Account.findById(accountId);
    if (account.collaborators.includes(userToAdd._id)) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

    account.collaborators.push(userToAdd._id);
    await account.save();

    res.json({ message: "Collaborator added" });
  } catch (err) {
    console.error("Add collaborator failed:", err);
    res.status(400).json({ message: err.message });
  }
};

// Remove collaborator (only owner)
export const removeCollaborator = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userIdToRemove = req.params.userId;

    await verifyAccountAccess(req.user._id, accountId);

    const account = await Account.findById(accountId);
    account.collaborators = account.collaborators.filter(
      (id) => id.toString() !== userIdToRemove
    );
    await account.save();

    res.json({ message: "Collaborator removed" });
  } catch (err) {
    console.error("Remove collaborator failed:", err);
    res.status(500).json({ message: err.message });
  }
};

// List collaborators
export const listCollaborators = async (req, res) => {
  try {
    const accountId = req.params.id;
    await verifyAccountAccess(req.user._id, accountId);

    const account = await Account.findById(accountId).populate(
      "collaborators",
      "username email"
    );

    res.json(account.collaborators);
  } catch (err) {
    console.error("Failed to list collaborators:", err);
    res.status(500).json({ message: err.message });
  }
};
