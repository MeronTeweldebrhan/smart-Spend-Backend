import Department from '../../models/Department/Department.js';
import { verifyAccountAccess } from '../../utlis/verifyOwnership.js';

// Utility: handle mongoose duplicate errors
const handleMongooseError = (error) => {
  if (error.code === 11000) {
    return "Department with this name already exists in the account";
  }
  return error.message;
};

export const createDepartment = async (req, res) => {
  try {
    const { account, name, code, description, manager } = req.body;
    if (!account || !name) return res.status(400).json({ message: "account and name are required" });

    await verifyAccountAccess(req.user._id, account, ["personal", "hotel"], "Department");

    const department = new Department({
      account,
      name,
      code,
      description,
      manager,
      createdBy: req.user._id,
    });

    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: handleMongooseError(error) });
  }
};


export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department || !department.isActive) return res.status(404).json({ message: "Department not found" });

    await verifyAccountAccess(req.user._id, department.account, ["personal", "hotel"], "Department");

    const { name, code, description, manager, isActive } = req.body;

    if (name !== undefined) department.name = name;
    if (code !== undefined) department.code = code;
    if (description !== undefined) department.description = description;
    if (manager !== undefined) department.manager = manager;
    if (isActive !== undefined) department.isActive = isActive;

    department.updatedBy = req.user._id;
    await department.save();

    res.json(department);
  } catch (error) {
    res.status(400).json({ message: handleMongooseError(error) });
  }
};




export const getDepartments = async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) throw new Error("accountId is required");
    
    await verifyAccountAccess(req.user._id, accountId, ["personal", "hotel"], "Department");
    
    const departments = await Department.find({ account: accountId, isActive: true })
      .populate('manager', 'name email')
      .select('_id name code description manager isActive');
    res.json(departments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'name email')
      .select('_id name code description manager isActive');
    if (!department) throw new Error("Department not found");
    
    await verifyAccountAccess(req.user._id, department.account, ["personal", "hotel"], "Department");
    res.json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) throw new Error("Department not found");
    
    await verifyAccountAccess(req.user._id, department.account, ["personal", "hotel"], "Department");
    
    // Soft delete by setting isActive to false
    department.isActive = false;
    department.updatedBy = req.user._id;
    await department.save();
    res.json({ message: "Department deactivated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};