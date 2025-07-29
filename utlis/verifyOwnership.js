import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";

// Middleware-style reusable function
export const verifyTransactionOwnership = async (userId, transactionId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.createdby.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  return transaction;
};
export const verifyCategoryOwnership = async (userId, categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new Error("Category not found");
  }
  if (category.createdby.toString() !== userId.toString()) {
    throw new Error("Not authorized to access this category");
  }
  return category;
};