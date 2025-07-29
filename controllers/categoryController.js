import Category from "../models/Category.js";
import { verifyCategoryOwnership } from "../utlis/verifyOwnership.js";
const createCategory = async (req, res) => {
  try {
    const category = await Category.create({
      ...req.body,
      createdby: req.user._id,
    });
    const populatedCategory = await Category.findById(category._id).populate(
      "createdby",
      "username"
    );
    res.status(201).json(populatedCategory);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

const getcategory = async (req, res) => {
  try {
    const category = await Category.find({ createdby: req.user._id });

    res.json(category);
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
};
const getcategorybyid = async (req, res) => {
  try {
    ///===verfif ownership===//
    const categoryId = req.params.id;
    await verifyCategoryOwnership(req.user._id, categoryId);

    const category = await findById(categoryId);

    res.json(category);
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
};
export { createCategory, getcategory, getcategorybyid };
