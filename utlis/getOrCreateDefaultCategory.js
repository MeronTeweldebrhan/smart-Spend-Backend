
import Category from "../models/Category.js";

export const getOrCreateDefaultCategory = async (userId,accountId) => {
  let category = await Category.findOne({
    name: "Uncategorized",
    createdby: userId,
    account: accountId
  });

  if (!category) {
    category = await Category.create({
      name: "Uncategorized",
      createdby: userId,
      account: accountId
    });
  }

  return category._id;
};

////
export const resolveCategoryId = async (inputCategory, userId,accountId) => {
  // If category not provided, use default
  if (!inputCategory) {
    return await getOrCreateDefaultCategory(userId,accountId);
  }

  // If it's a valid ObjectId (24 hex characters), assume it's already a valid ID
  const isValidObjectId = inputCategory.match(/^[0-9a-fA-F]{24}$/);
  if (isValidObjectId) return inputCategory;

  // Try to find category by name
  const categoryDoc = await Category.findOne({ name: inputCategory, createdby: userId,account: accountId });
  if (!categoryDoc) {
    throw new Error(`Category '${inputCategory}' not found. Please provide a valid category.`);
  }

  return categoryDoc._id;
};