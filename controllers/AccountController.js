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
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id },
        { "employeeUsers.user": req.user._id },
      ],
    })
      .populate("owner", "username")
      .populate("collaborators", "username email")
      .populate("employeeUsers.user", "username email");
      ///verify user==//
   
    res.json(accounts);
  } catch (err) {
    console.error("Failed to fetch accounts:", err);
    res.status(500).json({ message: err.message });
  }
};
//==Get Account By Id===//
export const getAccountById = async (req, res) => {
  try {
    const { id: accountId } = req.params;

    //==verify access===//
    await verifyAccountAccess(req.user._id, accountId);
    const account = await Account.findById(accountId)
      .populate("owner", "username")
      .populate("collaborators", "username email")
      .populate("employeeUsers.user", "username email");
    res.json(account);
  } catch (error) {
    console.error("Failed to fetch account:", error);
    res.status(500).json({ message: error.message });
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

// Delete account
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

// Add Employee to an Account
export const addEmployee = async (req, res) => {
  try {
    const { id: accountId } = req.params;
    const { email, permissions } = req.body;

    await verifyAccountAccess(req.user._id, accountId);

    const employeeUser = await User.findOne({ email });
    if (!employeeUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Check if the user is already an employee
    const isEmployee = account.employeeUsers.some(
      (e) => e.user.toString() === employeeUser._id.toString()
    );
    if (isEmployee) {
      return res.status(409).json({ message: "User is already an employee." });
    }

    account.employeeUsers.push({
      user: employeeUser._id,
      role: "employee", // Default role
      permissions,
    });

    await account.save();
    res.status(201).json(account);
  } catch (err) {
    console.error("Add employee failed:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update Employee Permissions
export const updateEmployeePermissions = async (req, res) => {
    try {
        const { id: accountId, employeeId } = req.params;
        const { permissions } = req.body;

        await verifyAccountAccess(req.user._id, accountId);

        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found." });
        }

        const employee = account.employeeUsers.id(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found." });
        }

        // Update permissions
        Object.assign(employee.permissions, permissions);

        // --- This line is likely failing. Add a try/catch here for more specific errors. ---
        await account.save();

        res.json(account);
    } catch (err) {
        console.error("Update employee permissions failed:", err);
        // Send back a more detailed error message to the frontend
        res.status(500).json({ message: err.message });
    }
};

// Remove Employee from an Account
export const removeEmployee = async (req, res) => {
  try {
    const { id: accountId, employeeId } = req.params;

    await verifyAccountAccess(req.user._id, accountId);

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    account.employeeUsers.pull(employeeId);
    await account.save();

    res.json({ message: "Employee removed successfully." });
  } catch (err) {
    console.error("Remove employee failed:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add collaborator by email
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
      return res
        .status(400)
        .json({ message: "User is already a collaborator" });
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
