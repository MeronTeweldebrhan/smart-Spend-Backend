
import Account from "../models/Account.js";

export const verifyAccountAccess = async (userId, accountId) => {
  const account = await Account.findById(accountId);

  if (!account) {
    throw new Error("Account not found");
  }

  const isOwner = account.owner.toString() === userId.toString();
  const isCollaborator = account.collaborators.some(
    (collabId) => collabId.toString() === userId.toString()
  );

  if (!isOwner && !isCollaborator) {
    throw new Error("You are not authorized to access this account");
  }

  return account; // return if needed (e.g. for owner check)
};

