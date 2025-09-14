import DepartmentAllocation from '../../models/Department/deptAllocation.js';
import { verifyAccountAccess } from '../../utlis/verifyOwnership.js';

export const getDepartmentAllocations = async (req, res) => {
  try {
    const { accountId, departmentId, itemId } = req.query;
    if (!accountId) throw new Error('accountId is required');

    await verifyAccountAccess(req.user._id, accountId, ['personal', 'hotel'], 'inventory');

    const query = { account: accountId };
    if (departmentId) query.department = departmentId;
    if (itemId) query.item = itemId;

    const allocations = await DepartmentAllocation.find(query)
      .populate('department', 'name')
      .populate('issue', 'issueNumber issueDate')
      .populate('requisition', 'reqNumber')
      .populate('item', 'name sku');
    res.json(allocations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getDepartmentAllocationById = async (req, res) => {
  try {
    const allocation = await DepartmentAllocation.findById(req.params.id)
      .populate('department', 'name')
      .populate('issue', 'issueNumber issueDate')
      .populate('requisition', 'reqNumber')
      .populate('item', 'name sku');
    if (!allocation) throw new Error('Department allocation not found');

    await verifyAccountAccess(req.user._id, allocation.account, ['personal', 'hotel'], 'inventory');
    res.json(allocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};