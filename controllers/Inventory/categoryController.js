import Category from "../../models/Inventory/Category.js";
import { verifyAccountAccess } from "../../utlis/verifyOwnership.js";

// Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, account} = req.body;
    const userId = req.user._id;

    if (!name || !account)
      return res.status(400).json({ error: "Name and accountId are required." });

    // Verify access
    await verifyAccountAccess(userId, account, ["personal", "hotel"], "categories");

    const category = await Category.create({
      name,
      account: account,
      createdby: userId,
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Categories by Account
// ...
export const getCategories = async (req, res) => {
    try {
        const { account } = req.query; // <-- Changed 'accountId' to 'account'

        if (!account) // <-- Updated the check
            return res.status(400).json({ error: "accountId is required." }); // You can keep the error message as is, or change it to be more specific.

        await verifyAccountAccess(req.user._id, account, ["personal", "hotel"], "categories");

        const categories = await Category.find({ account }).sort({ name: 1 });
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// ...

// Get Category by Id
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found." });

    await verifyAccountAccess(req.user._id, category.account, ["personal", "hotel"], "categories");

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found." });

    await verifyAccountAccess(req.user._id, category.account, ["personal", "hotel"], "categories");

    Object.assign(category, req.body);
    await category.save();

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found." });

    await verifyAccountAccess(req.user._id, category.account, ["personal", "hotel"], "categories");

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
