import StoreRequisition from '../../models/Inventory/StoreRequisition.js';
import { verifyAccountAccess } from '../../utlis/verifyOwnership.js';
import { generateCode } from '../../utlis/codeGenerator.js';
import Item from '../../models/Inventory/Item.js';

export const createStoreRequisition = async (req, res) => {
  try {
    const { account, department, lines, notes, createdBy } = req.body;
    if (!account || !department || !lines || !createdBy) {
      throw new Error('account, department, lines, and createdBy are required');
    }
    if (!lines.every(line => line.item && line.qty && line.unitCost !== undefined)) {
      throw new Error('Each line must have item, qty, and unitCost');
    }
    await verifyAccountAccess(req.user._id, account, ['personal', 'hotel'], 'inventory');

    // Validate items and unitCost
    for (const line of lines) {
      const item = await Item.findById(line.item);
      if (!item) throw new Error(`Item ${line.item} not found`);
      if (line.qty <= 0) throw new Error(`Quantity must be positive for item ${item.name}`);
      if (line.unitCost < 0) throw new Error(`Unit cost cannot be negative for item ${item.name}`);
    }

    const reqNumber = await generateCode({
      prefix: 'REQ',
      accountId: account,
      resetYearly: true,
    });

    const requisition = new StoreRequisition({
      account,
      department,
      reqNumber,
      lines,
      notes,
      createdBy,
    });
    await requisition.save();
    res.status(201).json(requisition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreRequisitions = async (req, res) => {
  try {
    const { accountId, departmentId, status } = req.query;
    if (!accountId) throw new Error('accountId is required');
    await verifyAccountAccess(req.user._id, accountId, ['personal', 'hotel'], 'inventory');

    const query = { account: accountId };
    if (departmentId) query.department = departmentId;
    if (status) query.status = status;

    const requisitions = await StoreRequisition.find(query)
      .populate('department', 'name')
      .populate('lines.item', 'name sku avgCost');
    res.json(requisitions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoreRequisitionById = async (req, res) => {
  try {
    const requisition = await StoreRequisition.findById(req.params.id)
      .populate('department', 'name')
      .populate('lines.item', 'name sku avgCost');
    if (!requisition) throw new Error('Requisition not found');
    await verifyAccountAccess(req.user._id, requisition.account, ['personal', 'hotel'], 'inventory');
    res.json(requisition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStoreRequisition = async (req, res) => {
  try {
    const { status, approvedBy, lines } = req.body;
    const requisition = await StoreRequisition.findById(req.params.id);
    if (!requisition) throw new Error('Requisition not found');
    await verifyAccountAccess(req.user._id, requisition.account, ['personal', 'hotel'], 'inventory');

    if (lines) {
      if (!lines.every(line => line.item && line.qty && line.unitCost !== undefined)) {
        throw new Error('Each line must have item, qty, and unitCost');
      }
      for (const line of lines) {
        const item = await Item.findById(line.item);
        if (!item) throw new Error(`Item ${line.item} not found`);
        if (line.qty <= 0) throw new Error(`Quantity must be positive for item ${item.name}`);
        if (line.unitCost < 0) throw new Error(`Unit cost cannot be negative for item ${item.name}`);
      }
      requisition.lines = lines;
    }

    requisition.status = status || requisition.status;
    requisition.approvedBy = approvedBy || requisition.approvedBy;
    requisition.updatedBy = req.user._id;
    await requisition.save();
    res.json(requisition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};