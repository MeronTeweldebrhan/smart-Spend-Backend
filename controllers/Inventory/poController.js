import PurchaseOrder from '../../models/Inventory/PurchaseOrder.js';
import Item from '../../models/Inventory/Item.js';
import Supplier from '../../models/Supplier/Supplier.js';
import { generateCode } from '../../utlis/codeGenerator.js';

export const createPurchaseOrder = async (req, res) => {
  try {
    const { accountId, supplier, poDate, lines, notes } = req.body;

    // Auto-generate PO number if not provided
    const poNumber = req.body.poNumber || await generateCode({
      accountId,
      prefix: "PO",
    });

    if (!accountId || !supplier || !poNumber || !lines || lines.length === 0) {
      return res.status(400).json({ message: 'Account, supplier, PO number, and at least one line item are required.' });
    }

    // Validate items and supplier exist
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({ message: 'Invalid supplier.' });
    }
    for (const line of lines) {
      const item = await Item.findById(line.item);
      if (!item) {
        return res.status(400).json({ message: `Invalid item ID: ${line.item}` });
      }
      // The schema's pre-save hook will handle TotalPrice, but doing it here
      // ensures the value is present for immediate return.
      line.TotalPrice = line.qty * line.unitPrice;
    }

    const purchaseOrder = new PurchaseOrder({
      account: accountId,
      supplier,
      poNumber,
      poDate: poDate || Date.now(),
      lines,
      notes,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await purchaseOrder.save();
    // Use .toObject({ virtuals: true }) to ensure the 'total' virtual is included
    const poWithVirtuals = purchaseOrder.toObject({ virtuals: true });
    res.status(201).json(poWithVirtuals);
  } catch (error) {
    console.error('Create Purchase Order Error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'PO number already exists for this account.' });
    } else {
      res.status(500).json({ message: error.message || 'Failed to create purchase order.' });
    }
  }
};

export const getPurchaseOrders = async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required.' });
    }

    const purchaseOrders = await PurchaseOrder.find({ account: accountId })
      .populate('supplier', 'name')
      .populate('lines.item', 'name sku')
      .lean({ virtuals: true }); 
      
    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error('Get Purchase Orders Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch purchase orders.' });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId } = req.query;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, account: accountId })
      .populate('supplier', 'name')
      .populate('lines.item', 'name sku')
      .lean({ virtuals: true }); 
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    console.error('Get Purchase Order Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch purchase order.' });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId, supplier, poNumber, poDate, lines, notes, status } = req.body;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required.' });
    }

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, account: accountId });
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    // Validate supplier and items if provided
    if (supplier) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        return res.status(400).json({ message: 'Invalid supplier.' });
      }
      purchaseOrder.supplier = supplier;
    }
    if (lines) {
      for (const line of lines) {
        const item = await Item.findById(line.item);
        if (!item) {
          return res.status(400).json({ message: `Invalid item ID: ${line.item}` });
        }
        // Ensure TotalPrice is calculated
        line.TotalPrice = line.qty * line.unitPrice;
      }
      purchaseOrder.lines = lines;
    }

    purchaseOrder.poNumber = poNumber || purchaseOrder.poNumber;
    purchaseOrder.poDate = poDate || purchaseOrder.poDate;
    purchaseOrder.notes = notes !== undefined ? notes : purchaseOrder.notes;
    purchaseOrder.status = status || purchaseOrder.status;
    purchaseOrder.updatedBy = req.user._id;

    await purchaseOrder.save();
    // Use .toObject({ virtuals: true }) to ensure the 'total' virtual is included
    const poWithVirtuals = purchaseOrder.toObject({ virtuals: true });
    res.status(200).json(poWithVirtuals);
  } catch (error) {
    console.error('Update Purchase Order Error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'PO number already exists for this account.' });
    } else {
      res.status(500).json({ message: error.message || 'Failed to update purchase order.' });
    }
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId } = req.query;

    const purchaseOrder = await PurchaseOrder.findOneAndDelete({ _id: id, account: accountId });
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    res.status(200).json({ message: 'Purchase Order deleted successfully.' });
  } catch (error) {
    console.error('Delete Purchase Order Error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete purchase order.' });
  }
};

export const receiveItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId, receivedLines } = req.body;

    if (!accountId || !receivedLines || !Array.isArray(receivedLines)) {
      return res.status(400).json({ message: 'Account ID and received lines are required.' });
    }

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, account: accountId });
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    if (purchaseOrder.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot receive items for a cancelled purchase order.' });
    }

    let allReceived = true;
    for (const received of receivedLines) {
      const line = purchaseOrder.lines.find(l => l.item.toString() === received.itemId);
      if (!line) {
        return res.status(400).json({ message: `Invalid item ID: ${received.itemId}` });
      }
      const newReceivedQty = line.receivedQty + received.quantity;
      if (newReceivedQty > line.qty) {
        return res.status(400).json({ message: `Received quantity for item ${line.item} exceeds ordered quantity.` });
      }
      line.receivedQty = newReceivedQty;
      if (line.receivedQty < line.qty) {
        allReceived = false;
      }
    }

    purchaseOrder.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    purchaseOrder.updatedBy = req.user._id;
    await purchaseOrder.save();

    // Convert to object to ensure virtuals are included
    const poWithVirtuals = purchaseOrder.toObject({ virtuals: true });
    res.status(200).json(poWithVirtuals);
  } catch (error) {
    console.error('Receive Items Error:', error);
    res.status(500).json({ message: error.message || 'Failed to receive items.' });
  }
};