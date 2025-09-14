import Account from "../models/Account.js";
import mongoose from "mongoose";
export const verifyAccountAccess = async (userId, accountId,requiredType = null,permissionKey = null) => {

console.log("Checking access for user", userId, "to account", accountId);


  // Check if accountId is a valid ObjectId and not null/undefined
   if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
        throw new Error("Invalid or missing accountId provided");
    }
  const account = await Account.findById(accountId);

  if (!account) {
    throw new Error("Account not found");
  }
  // --- Add these console.log statements ---
  console.log("Logged-in User ID:", userId.toString());
  console.log("Account Owner ID:", account.owner.toString());
  // ------------------------------------------
  const isOwner = account.owner.toString() === userId.toString();
  const isCollaborator = account.collaborators.some(
    (collabId) => collabId.toString() === userId.toString()
  );
  // New check for employee permissions
  const isEmployee = account.employeeUsers.some((employee) => {
    // Check if the user is an employee
    const isUser = employee.user.toString() === userId.toString();
    // Check if the employee has the specific permission
    const hasPermission = permissionKey
      ? employee.permissions[permissionKey]
      : false;
    // The employee is authorized if they have the permission or if we are not checking for a specific permission
    return isUser && (!permissionKey || hasPermission);
  });
  console.log("Is Owner:", isOwner);
  if (!isOwner && !isCollaborator && !isEmployee) {
    throw new Error("You are not authorized to access this account");
  }
  // ✅ Allow one or more account types
  if (requiredType) {
    if (Array.isArray(requiredType)) {
      if (!requiredType.includes(account.type)) {
        const error = new Error(
          `Access denied. This account must be one of: ${requiredType.join(", ")}.`
        );
        error.statusCode = 403;
        throw error;
      }
    } else if (account.type !== requiredType) {
      const error = new Error(
        `Access denied. This is not a ${requiredType} account.`
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return account; // return if needed (e.g. for owner check)
};
