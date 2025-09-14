import StoreRequisition from "../../models/Inventory/StoreRequisition.js";
import PurchaseOrder from "../../models/Inventory/PurchaseOrder.js";
import StoreIssue from "../../models/Inventory/StoreIssue.js";
import { verifyAccountAccess } from "../../utlis/verifyOwnership.js";

export const approveDocument = async (req, res) => {
  try {
    const { documentType, documentId } = req.params;
    const { status, remarks } = req.body;
    const user = req.user;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    let Model;
    switch (documentType.toLowerCase()) {
      case 'requisition':
        Model = StoreRequisition;
        break;
      case 'purchaseorder':
        Model = PurchaseOrder;
        break;
      case 'issue':
        Model = StoreIssue;
        break;
      default:
        return res.status(400).json({ message: "Invalid document type" });
    }

    const document = await Model.findById(documentId).populate('account');
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    await verifyAccountAccess(user._id, document.account._id, ["hotel"], "User");

    const currentStatus = document.status;
    const requiredLevel = currentStatus === 'DRAFT' ? 1 :
                          currentStatus === 'PENDING_LEVEL_1' ? 1 :
                          currentStatus === 'PENDING_LEVEL_2' ? 2 :
                          currentStatus === 'PENDING_LEVEL_3' ? 3 : null;

    if (!requiredLevel) {
      return res.status(400).json({ message: "Document is not pending approval" });
    }

    if (user.approvalLevel !== requiredLevel) {
      return res.status(403).json({ message: `User does not have approval level ${requiredLevel}` });
    }

    document.approvals.push({
      level: requiredLevel,
      approvedBy: user._id,
      approvedAt: new Date(),
      status,
      remarks,
    });

    if (status === 'REJECTED') {
      document.status = 'REJECTED';
    } else if (requiredLevel === 1) {
      document.status = 'PENDING_LEVEL_2';
    } else if (requiredLevel === 2) {
      document.status = 'PENDING_LEVEL_3';
    } else if (requiredLevel === 3) {
      document.status = 'APPROVED';
    }

    document.updatedBy = user._id;
    await document.save();
    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};