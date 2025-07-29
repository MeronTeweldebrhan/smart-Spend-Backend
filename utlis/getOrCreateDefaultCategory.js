
import Category from "../models/Category.js";

export const getOrCreateDefaultCategory = async (userId) => {
  let category = await Category.findOne({
    name: "Uncategorized",
    createdby: userId
  });

  if (!category) {
    category = await Category.create({
      name: "Uncategorized",
      createdby: userId
    });
  }

  return category._id;
};

////
export const resolveCategoryId = async (inputCategory, userId) => {
  // If category not provided, use default
  if (!inputCategory) {
    return await getOrCreateDefaultCategory(userId);
  }

  // If it's a valid ObjectId (24 hex characters), assume it's already a valid ID
  const isValidObjectId = inputCategory.match(/^[0-9a-fA-F]{24}$/);
  if (isValidObjectId) return inputCategory;

  // Try to find category by name
  const categoryDoc = await Category.findOne({ name: inputCategory, createdby: userId });
  if (!categoryDoc) {
    throw new Error(`Category '${inputCategory}' not found. Please provide a valid category.`);
  }

  return categoryDoc._id;
};