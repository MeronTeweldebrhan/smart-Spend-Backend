import Transaction from "../models/Transaction.js";
import { resolveCategoryId } from "../utlis/getOrCreateDefaultCategory.js";
import { verifyTransactionOwnership } from "../utlis/verifyOwnership.js";

///== ADD new Transaction ==//
const creatTransaction = async (req, res) => {
  try {
    const categoryId = await resolveCategoryId(req.body.category, req.user._id);

    const newTransaction = await Transaction.create({
      ...req.body,
      category: categoryId,
      createdby: req.user._id,
    });

    // Populate category and createdby with their names
    const populatedTransaction = await Transaction.findById(newTransaction._id)
      .populate("category", "name")
      .populate("createdby", "username");

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

///===Get transaction all with filters===///
const getTransactions = async (req, res) => {
  try {
    // ///===verfif ownership===//
    // const transactionId = req.params.id;
    // await verifyTransactionOwnership(req.user._id, transactionId);
    const {
      type, // income or expense
      category, // category ObjectId
      startDate, // YYYY-MM-DD
      endDate, // YYYY-MM-DD
      minAmount, // number
      maxAmount, // number
    } = req.query;

    const filters = { createdby: req.user._id };

    if (type) filters.type = type;

    if (category) filters.category = category;

    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filters.amount = {};
      if (minAmount) filters.amount.$gte = Number(minAmount);
      if (maxAmount) filters.amount.$lte = Number(maxAmount);
    }

    const transactions = await Transaction.find(filters)
      .sort({ date: -1 }) // recent first
      .populate("category", "name")
      .populate("createdby", "username");

    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

///===Update Transaction===//

const updatetransaction = async (req, res) => {
  try {
    ///===verfif ownership===//
    const transactionId = req.params.id;
    await verifyTransactionOwnership(req.user._id, transactionId);

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    )
      .populate("category", "name")
      .populate("createdby", "username");
    if (!updated) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

///===Delete Transactions===///
const deleteTransaction = async (req, res) => {
  try {
    ///===verfif ownership===//
    const transactionId = req.params.id;
    await verifyTransactionOwnership(req.user._id, transactionId);


    const { id } = req.params;
  const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//==Get by ID==//

const gettransactionbyID = async (req, res) => {
  try {
    ///===verfif ownership===//
    const transactionId = req.params.id;
    await verifyTransactionOwnership(req.user._id, transactionId);

    const { id } = req.params;
    const transaction = await Transaction.findById(id)
      .populate("category", "name")
      .populate("createdby", "username");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
export {
  creatTransaction,
  getTransactions,
  updatetransaction,
  deleteTransaction,
  gettransactionbyID,
};
