import ChartOfAccount from '../models/ChartOfAccount.js';

// Auto-generate code for ChartOfAccount
export const generateAccountCode = async ({ accountId, type, departmentCode, session }) => {
  // Define type-specific code ranges
  const codeRanges = {
    Asset: 1000,
    Liability: 2000,
    Equity: 3000,
    Revenue: 4000,
    Expense: 5000,
  };

  // If departmentCode provided (for Expense), return formatted code
  if (type === 'Expense' && departmentCode) {
    const code = `EXP-${departmentCode}`;
    const existing = await ChartOfAccount.findOne({ account: accountId, code }).session(session);
    if (existing) throw new Error(`Expense code ${code} already exists`);
    return code;
  }

  // For other types, auto-increment from type-specific range
  const minCode = codeRanges[type] || 1000;
  const query = { account: accountId, type };
  const existingCodes = await ChartOfAccount.find(query)
    .select('code')
    .lean()
    .session(session);

  const numericCodes = existingCodes
    .map(c => parseInt(c.code, 10))
    .filter(c => !isNaN(c) && c >= minCode)
    .sort((a, b) => a - b);

  // Find first available code in sequence
  let nextCode = minCode;
  if (numericCodes.length > 0) {
    const lastCode = numericCodes[numericCodes.length - 1];
    nextCode = lastCode + 1;
    // Check for gaps in sequence
    for (let i = 0; i < numericCodes.length; i++) {
      if (numericCodes[i] > minCode + i) {
        nextCode = minCode + i;
        break;
      }
    }
  }

  // Ensure code doesn't already exist
  const codeStr = nextCode.toString();
  const exists = await ChartOfAccount.findOne({ account: accountId, code: codeStr }).session(session);
  if (exists) throw new Error(`Code ${codeStr} already exists`);

  return codeStr;
};