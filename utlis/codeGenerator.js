
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Mongoose Schema for a generic counter.
 * This is used to atomically generate unique sequence numbers.
 */
const counterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || model('Counter', counterSchema);

/**
 * Generates a unique, sequential code for a document.
 * @param {Object} options
 * @param {String} options.prefix - Code prefix (e.g., "PO", "GRN", "INV").
 * @param {String} options.accountId - The unique account ID to scope the counter.
 * @param {Boolean} [options.resetYearly=true] - If true, resets the sequence every year.
 * @returns {String} The generated code (e.g., "GRN-2025-0001").
 */
export const generateCode = async ({
    prefix,
    accountId,
    resetYearly = true,
}) => {
    const now = new Date();
    const year = now.getFullYear();

    // The counter's unique ID is a combination of accountId, prefix, and year (if resetting)
    const counterId = resetYearly ? `${accountId}_${prefix}_${year}` : `${accountId}_${prefix}`;

    // Atomically find the counter document and increment its sequence number.
    // The 'upsert: true' option creates the document if it doesn't exist.
    const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    
    // Format the sequence number with leading zeros (e.g., 1 -> "0001")
    const seq = String(counter.seq).padStart(4, '0');

    // Return the final formatted code
    if (resetYearly) {
        return `${prefix}-${year}-${seq}`;
    } else {
        return `${prefix}-${seq}`;
    }
};