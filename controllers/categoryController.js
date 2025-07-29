import Category from "../models/Category.js";
import { verifyCategoryOwnership } from "../utlis/verifyOwnership.js";

///===Creat Category====///
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

///===get all users Categroy====///
const getcategory = async (req, res) => {
  try {
    const category = await Category.find({ createdby: req.user._id });

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
    const categoryId = req.params.id;
    await verifyCategoryOwnership(req.user._id, categoryId);

    const category = await findById(categoryId);

    res.json(category);
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
};

///===update Catergroy===///
const updateCategory =async (req,res)=>{
    try {
        const categoryId = req.params.id;
    await verifyCategoryOwnership(req.user._id, categoryId);
        
        const updated=await Category.findByIdAndUpdate(req.params.id,
      req.body,
      {
        new: true,
      }
    ) .populate("createdby", "username");
    res.json(updated)
    } catch (error) {
         console.error(error);
    res.status(500).json({ message: error.message });
    }
}

///===Delete Category===//

const deleteCategory=async (req,res)=>{
    try {
         const categoryId = req.params.id;
    await verifyCategoryOwnership(req.user._id, categoryId);
        const { id } = req.params;
        await Category.findByIdAndDelete(id)
        res.json({message:"category deleted"})
    } catch (error) {
        console.error(error);
    res.status(500).json({ message: error.message });
    }
}
export { createCategory, getcategory, getcategorybyid,updateCategory,deleteCategory };
