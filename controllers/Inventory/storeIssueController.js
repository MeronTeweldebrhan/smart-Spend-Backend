import StoreIssue from '../../models/Inventory/StoreIssue.js';
import StoreRequisition from '../../models/Inventory/StoreRequisition.js';
import Item from '../../models/Inventory/Item.js';
import StockLedger from '../../models/Inventory/StockLedger.js';
import DepartmentAllocation from '../../models/Department/deptAllocation.js';
import { verifyAccountAccess } from '../../utlis/verifyOwnership.js';
import { generateCode } from '../../utlis/codeGenerator.js';

export const createStoreIssue = async (req, res) => {
  try {
    const { account, department, requisition, lines, notes, createdBy, status } = req.body;
    if (!account || !department || !lines || !createdBy) {
      throw new Error('account, department, lines, and createdBy are required');
    }
    if (!lines.every(line => line.item && line.qty && line.unitCost !== undefined)) {
      throw new Error('Each line must have item, qty, and unitCost');
    }
    await verifyAccountAccess(req.user._id, account, ['personal', 'hotel'], 'inventory');

    // Validate stock availability and set unitCost
    for (const line of lines) {
      const item = await Item.findById(line.item);
      if (!item) throw new Error(`Item ${line.item} not found`);
      if (item.onHandQty < line.qty) {
        throw new Error(`Insufficient stock for item ${item.name}`);
      }
      if (line.unitCost < 0) throw new Error(`Unit cost cannot be negative for item ${item.name}`);
      const lastLedger = await StockLedger.findOne({ item: line.item, account }).sort({ createdAt: -1 });
      line.unitCost = lastLedger?.balanceAvgCost || item.avgCost || 0;
    }

    const issueNumber = await generateCode({
      prefix: 'ISS',
      accountId: account,
      resetYearly: true,
    });

    const issue = new StoreIssue({
      account,
      department,
      requisition,
      issueNumber,
      lines,
      notes,
      createdBy,
      status: status && ['DRAFT', 'PENDING_LEVEL_1', 'PENDING_LEVEL_2', 'PENDING_LEVEL_3', 'APPROVED', 'REJECTED'].includes(status) ? status : 'DRAFT',
    });
    await issue.save();

    // Update Item stock, StockLedger, and DepartmentAllocation
    for (const line of lines) {
      const item = await Item.findById(line.item);
      item.onHandQty -= line.qty;
      await item.save();

      const lastLedger = await StockLedger.findOne({ item: line.item, account }).sort({ createdAt: -1 });

      const ledger = new StockLedger({
        account,
        createdBy,
        item: line.item,
        docType: 'ISSUE',
        docId: issue._id,
        docNumber: issue.issueNumber,
        docDate: issue.issueDate,
        OpeningQty: lastLedger?.balanceQty || 0,
        IssuedQty: line.qty,
        unitCost: line.unitCost,
        totalCost: line.qty * line.unitCost,
        balanceQty: (lastLedger?.balanceQty || 0) - line.qty,
        balanceAvgCost: lastLedger?.balanceAvgCost || line.unitCost,
      });
      await ledger.save();

      const allocation = new DepartmentAllocation({
        account,
        department,
        issue: issue._id,
        requisition: line.reqId,
        item: line.item,
        qty: line.qty,
        unitCost: line.unitCost,
        totalCost: line.qty * line.unitCost,
        issueDate: issue.issueDate,
      });
      await allocation.save();
    }

    // Link issue to requisition and update status
    if (requisition) {
      await StoreRequisition.findByIdAndUpdate(requisition, {
        $push: { issues: issue._id },
        status: 'CLOSED',
        updatedBy: createdBy,
      });
    }

    res.status(201).json(issue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreIssues = async (req, res) => {
  try {
    const { accountId, departmentId } = req.query;
    if (!accountId) throw new Error('accountId is required');
    await verifyAccountAccess(req.user._id, accountId, ['personal', 'hotel'], 'inventory');

    const query = { account: accountId };
    if (departmentId) query.department = departmentId;

    const issues = await StoreIssue.find(query)
      .populate('department', 'name')
      .populate('requisition', 'reqNumber')
      .populate('lines.item', 'name sku');
    res.json(issues);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};