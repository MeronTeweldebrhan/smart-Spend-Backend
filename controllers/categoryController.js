import Category from "../models/Category.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

///===Creat Category====///
const createCategory = async (req, res) => {
  try {
    const { name, accountId } = req.body;
    const userId = req.user._id;
    // Check for existing category with same name (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }, // case-insensitive match
      createdby: userId,
      account: accountId,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: `Category '${name}' already exists.` });
    }

    //==verify access===//
    await verifyAccountAccess(
      req.user._id,
      accountId,
      ["personal", "hotel"],
      "categories"
    );

    const category = await Category.create({
      ...req.body,
      createdby: req.user._id,
      name: name.trim(),
      account: accountId,
    });
    const populatedCategory = await Category.findById(category._id)
      .populate("createdby", "username")
      .populate("account", "name");
    res.status(201).json(populatedCategory);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

///===get all users Categroy====///
const getcategory = async (req, res) => {
  try {
    const accountId = req.body.accountId || req.query.accountId;

    //==verify access===//
    await verifyAccountAccess(
      req.user._id,
      accountId,
      ["personal", "hotel"],
      "categories"
    );

    const category = await Category.find({ account: accountId }).populate(
      "createdby",
      "username"
    );

    res.json(category);
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
};

///===Get Single Category===///
const getcategorybyid = async (req, res) => {
  try {
    ///===verfify ownership===//
    const { id: categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) throw new Error("Category not found");

    await verifyAccountAccess(req.user._id, category.account, "categories");

    const populated = await Category.findById(categoryId)
      .populate("createdby", "username")
      .populate("account", "name");

    res.json(populated);
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
};

///===update Catergroy===///
const updateCategory = async (req, res) => {
  try {
    const { id: categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) throw new Error("Category not found");

    await verifyAccountAccess(
      req.user._id,
      category.account,
      ["personal", "hotel"],
      "categories"
    );

    const updated = await Category.findByIdAndUpdate(categoryId, req.body, {
      new: true,
    })
      .populate("createdby", "username")
      .populate("account", "name");

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

///===Delete Category===//

const deleteCategory = async (req, res) => {
  try {
    const { id: categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) throw new Error("Category not found");

    await verifyAccountAccess(
      req.user._id,
      category.account,
      ["personal", "hotel"],
      "categories"
    );

    await Category.findByIdAndDelete(categoryId);

    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
export {
  createCategory,
  getcategory,
  getcategorybyid,
  updateCategory,
  deleteCategory,
};
