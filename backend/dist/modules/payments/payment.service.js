"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const payment_model_1 = require("./payment.model");
const installment_model_1 = require("../installments/installment.model");
const chit_member_model_1 = require("../chit-members/chit-member.model");
const receipt_model_1 = require("../receipts/receipt.model");
const ApiError_1 = require("../../common/ApiError");
class PaymentService {
    static async processPayment(data, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { customerId, chitGroupId, chitMemberId, installmentId, amount, paymentMethod, transactionReference, branchId, idempotencyKey } = data;
            if (idempotencyKey) {
                const existingPayment = await payment_model_1.Payment.findOne({ idempotencyKey }).session(session);
                if (existingPayment) {
                    await session.abortTransaction();
                    return existingPayment;
                }
            }
            const installment = await installment_model_1.Installment.findById(installmentId).session(session);
            if (!installment) {
                throw new ApiError_1.ApiError(404, 'Installment not found', 'NOT_FOUND');
            }
            if (installment.status === 'PAID') {
                throw new ApiError_1.ApiError(400, 'Installment already paid', 'INVALID_OPERATION');
            }
            // Check amount
            if (amount > installment.pendingAmount) {
                throw new ApiError_1.ApiError(400, 'Payment amount exceeds pending amount', 'INVALID_OPERATION');
            }
            // 1. Create Payment
            const paymentNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const payment = await payment_model_1.Payment.create([{
                    paymentNumber,
                    customerId,
                    chitGroupId,
                    chitMemberId,
                    installmentId,
                    amount,
                    paymentMethod,
                    transactionReference,
                    status: 'SUCCESS',
                    branchId,
                    collectedBy: userId,
                    idempotencyKey
                }], { session });
            // 2. Update Installment
            installment.paidAmount += amount;
            installment.pendingAmount -= amount;
            if (installment.pendingAmount <= 0) {
                installment.status = 'PAID';
                installment.paidAt = new Date();
            }
            else {
                installment.status = 'PARTIAL';
            }
            await installment.save({ session });
            // 3. Update Member Summary
            await chit_member_model_1.ChitMember.findByIdAndUpdate(chitMemberId, {
                $inc: {
                    totalPaid: amount,
                    totalDue: -amount,
                    totalPending: -amount,
                }
            }, { session });
            // 4. Create Receipt
            const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const receipt = await receipt_model_1.Receipt.create([{
                    receiptNumber,
                    paymentId: payment[0]._id,
                    customerId,
                    chitGroupId,
                    amount,
                    paymentMethod,
                    generatedBy: userId
                }], { session });
            // TODO: Create Ledger Entry
            // TODO: Create Audit Log
            // TODO: Create Notification
            await session.commitTransaction();
            session.endSession();
            return { payment: payment[0], receipt: receipt[0] };
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
