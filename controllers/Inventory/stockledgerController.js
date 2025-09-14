import mongoose from "mongoose";
import StockLedger from "../../models/Inventory/StockLedger.js";
import Item from "../../models/Inventory/Item.js";
import { verifyAccountAccess } from "../../utlis/verifyOwnership.js";

// Create Stock Ledger Entry
export const createStockLedger = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountId, itemId, type, quantity, reference, note } = req.body;
    const userId = req.user._id;

    if (!accountId || !itemId || !type || !quantity) {
      throw new Error("accountId, itemId, type, and quantity are required.");
    }

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    await verifyAccountAccess(userId, accountObjectId, ["personal", "hotel"], "inventory");

    const item = await Item.findOne({ _id: itemObjectId, account: accountObjectId }).session(session);
    if (!item) throw new Error("Invalid or inaccessible item");

    // Determine quantities based on document type
    let receivedQty = 0;
    let issuedQty = 0;
    let adjustQty = 0;

    if (type === 'GRN') {
      receivedQty = quantity; // Set receivedQty for GRN
    } else if (type === 'ISSUE') {
      issuedQty = quantity; // Set IssuedQty for ISSUE
    } else if (type === 'ADJUSTMENT') {
      adjustQty = quantity; // Set AdjustQty for ADJUSTMENT
    } else {
      throw new Error("Invalid document type. Use 'GRN', 'ISSUE', or 'ADJUSTMENT'.");
    }

    const ledger = await StockLedger.create(
      [
        {
          account: accountObjectId,
          item: itemObjectId,
          type,
          receivedQty, // Use the determined receivedQty
          IssuedQty: issuedQty, // Use the determined IssuedQty
          AdjustQty: adjustQty, // Use the determined AdjustQty
          OpeningQty: 0, // Initialize OpeningQty to 0 for new entries (update if needed)
          unitCost: 0, // Set a default or require this in req.body
          totalCost: 0, // Set a default or require this in req.body
          balanceQty: 0, // Initialize balanceQty (will be updated by subsequent logic if needed)
          reference: reference?.trim(),
          note: note?.trim(),
          createdBy: userId,
        },
      ],
      { session }
    );

    const populated = await StockLedger.findById(ledger[0]._id)
      .populate("item", "name sku barcode")
      .populate("createdBy", "username")
      .populate("account", "name")
      .session(session);

    // Update balanceQty if this is not the first entry (optional, depending on your logic)
    if (populated.OpeningQty === 0) {
      const previousBalance = await StockLedger.findOne(
        { item: itemObjectId, account: accountObjectId, createdAt: { $lt: populated.createdAt } },
        { balanceQty: 1 },
        { sort: { createdAt: -1 }, session }
      );
      populated.balanceQty = (previousBalance?.balanceQty || 0) + receivedQty - issuedQty + adjustQty;
      await populated.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(populated);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Get All Ledger Entries
export const getStockLedgers = async (req, res) => {
  try {
    const { accountId, itemId, type, startDate, endDate } = req.query;
    const userId = req.user._id;

    if (!accountId) throw new Error("accountId is required");

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    await verifyAccountAccess(userId, accountObjectId, ["personal", "hotel"], "inventory");

    const filter = { account: accountObjectId };
    if (itemId) filter.item = new mongoose.Types.ObjectId(itemId);
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const ledgers = await StockLedger.find(filter)
      .populate("item", "name sku barcode")
      .populate("createdBy", "username")
      .populate("account", "name")
      .sort({ createdAt: -1 });

    res.json(ledgers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Get Single Ledger Entry
export const getStockLedgerById = async (req, res) => {
  try {
    const { id } = req.params;
    const ledger = await StockLedger.findById(id);
    if (!ledger) throw new Error("Ledger entry not found");

    const accountObjectId = new mongoose.Types.ObjectId(ledger.account);
    await verifyAccountAccess(req.user._id, accountObjectId, ["personal", "hotel"], "inventory");

    const populated = await StockLedger.findById(id)
      .populate("item", "name sku barcode")
      .populate("createdBy", "username")
      .populate("account", "name");

    res.json(populated);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Update Ledger Entry
export const updateStockLedger = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { type, quantity, reference, note, accountId } = req.body;
    const userId = req.user._id;

    if (!accountId) throw new Error("accountId is required");

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    await verifyAccountAccess(userId, accountObjectId, ["personal", "hotel"], "inventory");

    const updated = await StockLedger.findOneAndUpdate(
      { _id: id, account: accountObjectId },
      {
        type,
        quantity,
        reference: reference?.trim(),
        note: note?.trim(),
        updatedBy: userId,
      },
      { new: true, session }
    )
      .populate("item", "name sku barcode")
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate("account", "name");

    if (!updated) throw new Error("Ledger entry not found");

    await session.commitTransaction();
    res.json(updated);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Delete Ledger Entry
export const deleteStockLedger = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { accountId } = req.query;
    const userId = req.user._id;

    if (!accountId) throw new Error("accountId is required");

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const ledger = await StockLedger.findOne({ _id: id, account: accountObjectId }).session(session);
    if (!ledger) throw new Error("Ledger entry not found");

    await verifyAccountAccess(userId, accountObjectId, ["personal", "hotel"], "inventory");

    await StockLedger.deleteOne({ _id: id }).session(session);

    await session.commitTransaction();
    res.json({ message: "Ledger entry deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(404).json({ message: error.message });
  } finally {
    session.endSession();
  }
};
// Get Current Stock Balance per Item
// // Get Current Stock Balance per Item (with full movement)
// export const getStockBalances = async (req, res) => {
//   try {
//     const { accountId } = req.query;
//     const userId = req.user._id;

//     if (!accountId) throw new Error("accountId is required");

//     const accountObjectId = new mongoose.Types.ObjectId(accountId);
//     await verifyAccountAccess(userId, accountObjectId, ["personal", "hotel"], "inventory");

//     // Aggregate movements per item
//     const balances = await StockLedger.aggregate([
//       { $match: { account: accountObjectId } },
//       {
//         $group: {
//           _id: "$item",
//           OpeningQty: { $first: "$OpeningQty" },
//           totalReceived: { $sum: "$receivedQty" },
//           totalIssued: { $sum: "$IssuedQty" },
//           totalAdjusted: { $sum: "$AdjustQty" },
//           balanceQty: { $last: "$balanceQty" },
//         },
//       },
//       {
//         $project: {
//           item: "$_id",
//           OpeningQty: 1,
//           receivedQty: "$totalReceived",
//           IssuedQty: "$totalIssued",
//           AdjustQty: "$totalAdjusted",
//           balance: "$balanceQty",
//           _id: 0,
//         },
//       },
//     ]);

//     // Calculate totals for received and issued
//     const totals = await StockLedger.aggregate([
//       { $match: { account: accountObjectId } },
//       {
//         $group: {
//           _id: null,
//           totalReceived: { $sum: "$receivedQty" }, // Fixed field name
//           totalIssued: { $sum: "$IssuedQty" },
//         },
//       },
//     ]);

//     // Populate item info
//     const populated = await Item.populate(balances, { path: "item", select: "name sku" });

//     // Return balances and totals
//     res.json({
//       balances: populated,
//       totals: {
//         totalReceived: totals[0]?.totalReceived || 0,
//         totalIssued: totals[0]?.totalIssued || 0,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

export const getStockBalances = async (req, res) => {
  try {
    const { accountId, fromDate, toDate, includeZeroBalance, maxUnitCost, minUnitCost, category } = req.query;
    const userId = req.user._id;

    if (!accountId) throw new Error("accountId is required");

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    await verifyAccountAccess(userId, accountObjectId, ["personal", "hotel"], "inventory");

    // Build match conditions for items
    const itemMatch = { account: accountObjectId };
    if (minUnitCost || maxUnitCost) {
      itemMatch.costPrice = {};
      if (minUnitCost) itemMatch.costPrice.$gte = Number(minUnitCost);
      if (maxUnitCost) itemMatch.costPrice.$lte = Number(maxUnitCost);
    }

    // If category filter is provided, find matching category IDs
    let categoryIds = [];
    if (category) {
      categoryIds = await mongoose.model('Category').find({ 
        name: { $regex: category, $options: 'i' } 
      }).select('_id');
      itemMatch.category = { $in: categoryIds.map(c => c._id) };
    }

    // Get all items for the account with filters and populate category
    const allItems = await mongoose.model('Item')
      .find(itemMatch)
      .populate('category', 'name')
      .select('_id name sku category costPrice');

    // Build match conditions for stock ledger
    const ledgerMatch = { 
      account: accountObjectId, 
      receivedQty: { $exists: true, $ne: null }
    };
    if (fromDate || toDate) {
      ledgerMatch.createdAt = {};
      if (fromDate) ledgerMatch.createdAt.$gte = new Date(fromDate);
      if (toDate) ledgerMatch.createdAt.$lte = new Date(toDate);
    }

    // Aggregate movements per item
    const balances = await mongoose.model('StockLedger').aggregate([
      { $match: ledgerMatch },
      {
        $group: {
          _id: "$item",
          OpeningQty: { $first: "$OpeningQty" },
          totalReceived: { $sum: { $ifNull: ["$receivedQty", 0] } },
          totalIssued: { $sum: { $ifNull: ["$IssuedQty", 0] } },
          totalAdjusted: { $sum: { $ifNull: ["$AdjustQty", 0] } },
          balanceQty: { $last: "$balanceQty" },
          unitCost: { $last: "$unitCost" }, // Use StockLedger.unitCost
        },
      },
      {
        $project: {
          item: "$_id",
          OpeningQty: 1,
          receivedQty: "$totalReceived",
          IssuedQty: "$totalIssued",
          AdjustQty: "$totalAdjusted",
          balance: "$balanceQty",
          unitCost: 1,
          _id: 0,
        },
      },
    ]);

    // Merge balances with all items
    const itemMap = new Map(balances.map(b => [b.item.toString(), b]));
    const mergedBalances = allItems.map(item => {
      const balance = itemMap.get(item._id.toString()) || {
        item: item._id,
        OpeningQty: 0,
        receivedQty: 0,
        IssuedQty: 0,
        AdjustQty: 0,
        balance: 0,
        unitCost: item.costPrice || 0, // Fallback to Item.costPrice if no ledger entry
      };
      // Calculate balance if not provided or to verify
      const calculatedBalance = (balance.OpeningQty || 0) + (balance.receivedQty || 0) - (balance.IssuedQty || 0) + (balance.AdjustQty || 0);
      return { 
        ...balance, 
        item: {
          _id: item._id,
          name: item.name,
          sku: item.sku,
          category: item.category ? item.category.name : '-', // Use category name
          costPrice: item.costPrice // Include for reference
        },
        balance: balance.balance || calculatedBalance 
      };
    });

    // Filter out zero balances if not requested
    const filteredBalances = includeZeroBalance === 'true' 
      ? mergedBalances 
      : mergedBalances.filter(b => b.balance !== 0);

    // Calculate totals for received and issued
    const totals = await mongoose.model('StockLedger').aggregate([
      { $match: ledgerMatch },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: { $ifNull: ["$receivedQty", 0] } },
          totalIssued: { $sum: { $ifNull: ["$IssuedQty", 0] } },
        },
      },
    ]);

    res.json({
      balances: filteredBalances,
      totals: {
        totalReceived: totals[0]?.totalReceived || 0,
        totalIssued: totals[0]?.totalIssued || 0,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};