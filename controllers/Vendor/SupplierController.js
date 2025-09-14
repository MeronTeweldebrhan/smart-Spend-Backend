import Supplier from '../../models/Supplier/Supplier.js';

export const createSupplier = async (req, res) => {
  try {
    const { accountId, name, contactName, email, phone, address, notes } = req.body;
    if (!accountId || !name) {
      return res.status(400).json({ message: 'Account ID and name are required.' });
    }

    const supplier = new Supplier({
      account: accountId,
      name,
      contactName,
      email,
      phone,
      address,
      notes,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create Supplier Error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Supplier name already exists for this account.' });
    } else {
      res.status(500).json({ message: error.message || 'Failed to create supplier.' });
    }
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const { account } = req.query;
    if (!account) {
      return res.status(400).json({ message: 'Account ID is required.' });
    }

    const suppliers = await Supplier.find({ account });
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Get Suppliers Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch suppliers.' });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId } = req.query;

    const supplier = await Supplier.findOne({ _id: id, account: accountId });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error('Get Supplier Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch supplier.' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId, name, contactName, email, phone, address, notes } = req.body;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required.' });
    }

    const supplier = await Supplier.findOne({ _id: id, account: accountId });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    supplier.name = name || supplier.name;
    supplier.contactName = contactName || supplier.contactName;
    supplier.email = email || supplier.email;
    supplier.phone = phone || supplier.phone;
    supplier.address = address || supplier.address;
    supplier.notes = notes || supplier.notes;
    supplier.updatedBy = req.user._id;

    await supplier.save();
    res.status(200).json(supplier);
  } catch (error) {
    console.error('Update Supplier Error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Supplier name already exists for this account.' });
    } else {
      res.status(500).json({ message: error.message || 'Failed to update supplier.' });
    }
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId } = req.query;

    const supplier = await Supplier.findOneAndDelete({ _id: id, account: accountId });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    res.status(200).json({ message: 'Supplier deleted successfully.' });
  } catch (error) {
    console.error('Delete Supplier Error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete supplier.' });
  }
};