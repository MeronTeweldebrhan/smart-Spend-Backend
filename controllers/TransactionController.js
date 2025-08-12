import Transaction from "../models/Transaction.js";
import { resolveCategoryId } from "../utlis/getOrCreateDefaultCategory.js";
// import { verifyTransactionOwnership } from "../utlis/verifyOwnership.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

///== ADD new Transaction ==//
const creatTransaction = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
     const accountId = req.body.accountId
 if (!accountId) {
      throw new Error("Missing account ID in transaction payload");
    }
    // Ensure user has access to the target account
    await verifyAccountAccess(req.user._id, accountId,["personal", "hotel"],'transactions');
    const transactionsToCreate = await Promise.all(
      payload.map(async (txn) => {
        const categoryId = await resolveCategoryId(txn.category, req.user._id,accountId);
        return {
          ...txn,
          amount: Number(txn.amount),
          category: categoryId,
          createdby: req.user._id,
          account: accountId
        };
      })
    );

    const createdTransactions = await Transaction.insertMany(transactionsToCreate);

    // Optional: populate category & createdby
    const populated = await Transaction.find({
      _id: { $in: createdTransactions.map((t) => t._id) },
    })
      .populate("category", "name")
      .populate("createdby", "username")
      .populate("account",  "name");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Transaction creation failed:", error);
    res.status(400).json({ message: error.message });
  }
};


///===Get transaction all with filters===///
const getTransactions = async (req, res) => {
  try {
    // ///===verfif ownership===//
    const { accountId } = req.query;
    await verifyAccountAccess(req.user._id, accountId,["personal", "hotel"],'transactions');
    const {
      type, // income or expense
      category, // category ObjectId
      startDate, // YYYY-MM-DD
      endDate, // YYYY-MM-DD
      minAmount, // number
      maxAmount, // number
    } = req.query;

    const filters = { account: accountId } ;

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
      .populate("createdby", "username")
      .populate("account",  "name");

    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

///===Update Transaction===//

const updatetransaction = async (req, res) => {
  try {
     const accountId=req.body.accountId || req.query.accountId

    //==verify access===//
    await verifyAccountAccess(req.user._id, accountId,["personal", "hotel"],'transactions');

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    )
      .populate("category", "name")
      .populate("createdby", "username")
      .populate("account",  "name");
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
     const accountId= req.query.accountId
     const { id } = req.params;

    if (!accountId) {
      return res.status(400).json({ message: "Missing accountId" });
    }
    await verifyAccountAccess(req.user._id, accountId,["personal", "hotel"],'transactions');


    
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
   

    const { id } = req.params;
    const transaction = await Transaction.findById(id)
      .populate("category", "name")
      .populate("createdby", "username")
      .populate("account",  "name");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
     ///===verfif ownership===//
    
    await verifyAccountAccess(req.user._id, accountId,["personal", "hotel"],'transactions');
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
