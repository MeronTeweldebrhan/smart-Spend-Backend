import mongoose from "mongoose";
import Item from "../../models/Inventory/Item.js";
import Category from "../../models/Inventory/Category.js";
import StockLedger from "../../models/Inventory/StockLedger.js";
import { verifyAccountAccess } from "../../utlis/verifyOwnership.js";

const toObjectId = (id) => {
  if (!id) return null;
  return new mongoose.Types.ObjectId(id);
};
// Create
export const createItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      accountId,
      name,
      sku,
      uom,
      category,
      description,
      barcode,
      costPrice,
      sellingPrice,
      minQty,
      reorderQty,
    } = req.body;
    const userId = req.user._id;

    if (!name || !accountId || !uom || !category) {
      throw new Error("Name, accountId, uom, and category are required.");
    }

    const accountObjectId = toObjectId(accountId);
    if (!accountObjectId) throw new Error("Account ID required");
    // Convert category
    const categoryObjectId = toObjectId(category);
    if (!categoryObjectId) throw new Error("Category required");

    await verifyAccountAccess(
      userId,
      accountObjectId,
      ["personal", "hotel"],
      "inventory"
    );

    // Validate category (must be leaf-level)
    const categoryDoc = await Category.findOne({
      _id: categoryObjectId,
      account: accountObjectId,
    }).session(session);
    if (!categoryDoc) throw new Error("Invalid or inaccessible category");

    const subCategories = await Category.countDocuments({
      account: accountObjectId,
      parentCategory: categoryObjectId,
    }).session(session);
    if (subCategories > 0)
      throw new Error("Items can only be assigned to leaf-level categories.");

    // Check for duplicates
    const existing = await Item.findOne({
      account: accountObjectId,
      $or: [
        { name: { $regex: new RegExp(`^${name.trim()}$`, "i") } },
        sku ? { sku: sku.trim() } : null,
        barcode ? { barcode: barcode.trim() } : null,
      ].filter(Boolean),
    }).session(session);

    if (existing)
      throw new Error(
        `Item with name '${name}', SKU '${sku}', or barcode '${barcode}' already exists.`
      );

    const newItem = await Item.create(
      [
        {
          account: accountObjectId,
          name: name.trim(),
          sku: sku?.trim(),
          uom,
          category: categoryObjectId,
          description: description?.trim(),
          barcode: barcode?.trim(),
          costPrice: costPrice || 0,
          sellingPrice: sellingPrice || 0,
          minQty: minQty || 0,
          reorderQty: reorderQty || 0,
          createdBy: userId,
        },
      ],
      { session }
    );

    const populatedItem = await Item.findById(newItem[0]._id)
      .populate("createdBy", "username")
      .populate("category", "name parentCategory")
      .populate("account", "name")
      .session(session);

    await session.commitTransaction();
    res.status(201).json(populatedItem);
  } catch (error) {
    await session.abortTransaction();
    res
      .status(error.message.includes("already exists") ? 409 : 400)
      .json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Get All
export const getItems = async (req, res) => {
  try {
    const { accountId } = req.query;
    const userId = req.user._id;

    if (!accountId)
      return res.status(400).json({ message: "accountId is required" });

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    await verifyAccountAccess(
      userId,
      accountObjectId,
      ["personal", "hotel"],
      "inventory"
    );

    const items = await Item.find({ account: accountObjectId })
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate("category", "name parentCategory")
      .populate("account", "name");

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Item
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) throw new Error("Item not found");

    const accountObjectId = new mongoose.Types.ObjectId(item.account);
    await verifyAccountAccess(
      req.user._id,
      accountObjectId,
      ["personal", "hotel"],
      "inventory"
    );

    const populated = await Item.findById(id)
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate("category", "name parentCategory")
      .populate({
        path: "category",
        populate: { path: "parentCategory", select: "name" },
      })
      .populate("account", "name");

    res.json(populated);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Update
export const updateItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      barcode,
      category,
      accountId,
      costPrice,
      sellingPrice,
      minQty,
      reorderQty,
      ...otherFields
    } = req.body;
    const userId = req.user._id;

    if (!accountId) throw new Error("accountId is required");

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    await verifyAccountAccess(
      userId,
      accountObjectId,
      ["personal", "hotel"],
      "inventory"
    );

    let categoryObjectId = null;
    if (category) {
      categoryObjectId = new mongoose.Types.ObjectId(category);

      const categoryDoc = await Category.findOne({
        _id: categoryObjectId,
        account: accountObjectId,
      }).session(session);
      if (!categoryDoc) throw new Error("Invalid or inaccessible category");

      const subCategories = await Category.countDocuments({
        account: accountObjectId,
        parentCategory: categoryObjectId,
      }).session(session);
      if (subCategories > 0)
        throw new Error("Items can only be assigned to leaf-level categories.");
    }

    const existing = await Item.findOne({
      _id: { $ne: id },
      $or: [
        name
          ? {
              name: {
                $regex: new RegExp(`^${name.trim()}$`, "i"),
                account: accountObjectId,
              },
            }
          : null,
        sku ? { sku: sku.trim(), account: accountObjectId } : null,
        barcode ? { barcode: barcode.trim(), account: accountObjectId } : null,
      ].filter(Boolean),
    }).session(session);
    if (existing)
      throw new Error(
        `Item with name '${name}', SKU '${sku}', or barcode '${barcode}' already exists.`
      );

    const updated = await Item.findOneAndUpdate(
      { _id: id, account: accountObjectId },
      {
        ...otherFields,
        name: name?.trim(),
        sku: sku?.trim(),
        barcode: barcode?.trim(),
        category: categoryObjectId,
        costPrice: costPrice ?? undefined,
        sellingPrice: sellingPrice ?? undefined,
        minQty: minQty ?? undefined,
        reorderQty: reorderQty ?? undefined,
        updatedBy: userId,
      },
      { new: true, session }
    );

    if (!updated) throw new Error("Item not found");

    const populated = await Item.findById(id)
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate("category", "name parentCategory")
      .populate({
        path: "category",
        populate: { path: "parentCategory", select: "name" },
      })
      .populate("account", "name")
      .session(session);

    await session.commitTransaction();
    res.status(200).json(populated);
  } catch (error) {
    await session.abortTransaction();
    res
      .status(error.message.includes("already exists") ? 409 : 400)
      .json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Delete
export const deleteItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { accountId } = req.query;
    const userId = req.user._id;

    if (!accountId) throw new Error("accountId is required");

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const item = await Item.findOne({
      _id: id,
      account: accountObjectId,
    }).session(session);
    if (!item) throw new Error("Item not found");

    await verifyAccountAccess(
      userId,
      accountObjectId,
      ["personal", "hotel"],
      "inventory"
    );

    const linkedTransactions = await StockLedger.countDocuments({
      account: accountObjectId,
      item: id,
    }).session(session);

    if (linkedTransactions > 0) {
      throw new Error(
        `Cannot delete "${item.name}" because it has ${linkedTransactions} linked inventory transaction(s).`
      );
    }

    await Item.deleteOne({ _id: id }).session(session);
    await session.commitTransaction();
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(error.message.includes("linked") ? 400 : 404)
      .json({ message: error.message });
  } finally {
    session.endSession();
  }
};
