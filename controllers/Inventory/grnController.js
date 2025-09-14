import mongoose from "mongoose";
import GRN from '../../models/Inventory/GRN.js';
import PurchaseOrder from '../../models/Inventory/PurchaseOrder.js';
import StockLedger from "../../models/Inventory/StockLedger.js";
import Item from '../../models/Inventory/Item.js';
import { generateCode } from '../../utlis/codeGenerator.js';

export const createGRN = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { accountId, purchaseOrderId, lines, notes } = req.body;
        const userId = req.user._id;

        if (!accountId || !purchaseOrderId || !lines || lines.length === 0) {
            throw new Error('Account, Purchase Order ID, and at least one received line are required.');
        }

        const purchaseOrder = await PurchaseOrder.findOne({ _id: purchaseOrderId, account: accountId }).session(session);
        if (!purchaseOrder) {
            throw new Error('Purchase Order not found.');
        }

        if (purchaseOrder.status === 'CANCELLED' || purchaseOrder.status === 'RECEIVED') {
            throw new Error(`Cannot receive items for a ${purchaseOrder.status} purchase order.`);
        }
        
        const grnNumber = await generateCode({
            accountId,
            prefix: "GRN",
        });

        const receivedLines = [];
        const ledgerEntries = [];
        let allItemsReceived = true;

        for (const line of lines) {
            const poLine = purchaseOrder.lines.find(l => l.item.toString() === line.item);
            if (!poLine) {
                throw new Error(`Item with ID ${line.item} not found in the purchase order.`);
            }

            const newReceivedQty = poLine.receivedQty + line.quantityReceived;
            if (newReceivedQty > poLine.qty) {
                throw new Error(`Received quantity for item ${poLine.item} exceeds ordered quantity.`);
            }

            // --- Inventory and Stock Ledger Logic ---
            const item = await Item.findById(poLine.item).session(session);
            if (!item) throw new Error("Item not found");

            // Find the most recent stock ledger entry for this item
            const lastLedgerEntry = await StockLedger.findOne({ item: poLine.item, account: accountId })
                .sort({ createdAt: -1 })
                .session(session);

            // Calculate running balances for the new ledger entry
            const previousBalanceQty = lastLedgerEntry ? lastLedgerEntry.balanceQty : 0;
            const previousAvgCost = lastLedgerEntry ? lastLedgerEntry.balanceAvgCost : 0;
            const unitCost = poLine.unitPrice;
            const totalCost = unitCost * line.quantityReceived;

            const newBalanceQty = previousBalanceQty + line.quantityReceived;
            const newBalanceAvgCost = (
                (previousBalanceQty * previousAvgCost) + totalCost
            ) / newBalanceQty;

            // Create a new ledger entry
            const ledgerEntry = {
                account: accountId,
                item: poLine.item,
                docType: "GRN",
                docId: null, // This will be updated after GRN is created
                docNumber: grnNumber,
                docDate: new Date(),
                receivedQty: line.quantityReceived,
                IssuedQty: 0,
                unitCost: unitCost,
                totalCost: totalCost,
                balanceQty: newBalanceQty,
                balanceAvgCost: newBalanceAvgCost,
                createdBy: userId,
            };
            ledgerEntries.push(ledgerEntry);

            // Update item's stock and average cost
            item.currentStock = newBalanceQty;
            item.avgCost = newBalanceAvgCost;
            item.updatedBy = userId;
            await item.save({ session });
            // --- End of Inventory and Stock Ledger Logic ---

            poLine.receivedQty = newReceivedQty;
            if (poLine.receivedQty < poLine.qty) {
                allItemsReceived = false;
            }

            receivedLines.push({
                item: line.item,
                quantityReceived: line.quantityReceived,
            });
        }

        // Update the purchase order's status
        purchaseOrder.status = allItemsReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
        purchaseOrder.updatedBy = userId;
        await purchaseOrder.save({ session });

        // Create the GRN document
        const grn = new GRN({
            account: accountId,
            grnNumber,
            purchaseOrder: purchaseOrderId,
            lines: receivedLines,
            notes,
            createdBy: userId,
        });
        await grn.save({ session });

        // Update ledger entries with the newly created GRN ID and save them
        for (const entry of ledgerEntries) {
            entry.docId = grn._id;
        }
        await StockLedger.insertMany(ledgerEntries, { session });
        
        await session.commitTransaction();
        res.status(201).json(grn);

    } catch (error) {
        await session.abortTransaction();
        console.error('Create GRN Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create GRN.' });
    } finally {
        session.endSession();
    }
};

export const getGRNs = async (req, res) => {
    try {
        const { accountId } = req.query;
        if (!accountId) {
            return res.status(400).json({ message: 'Account ID is required.' });
        }

        const grns = await GRN.find({ account: accountId })
            .populate('purchaseOrder', 'poNumber')
            .populate('lines.item', 'name sku')
            .sort({ createdAt: -1 });

        res.status(200).json(grns);
    } catch (error) {
        console.error('Get GRNs Error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch GRNs.' });
    }
};

export const getGRNById = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountId } = req.query;

        const grn = await GRN.findOne({ _id: id, account: accountId })
            .populate('purchaseOrder', 'poNumber')
            .populate('lines.item', 'name sku');
        
        if (!grn) {
            return res.status(404).json({ message: 'GRN not found.' });
        }

        res.status(200).json(grn);
    } catch (error) {
        console.error('Get GRN Error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch GRN.' });
    }
};

