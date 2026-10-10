"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("./payment.service");
const payment_model_1 = require("./payment.model");
class PaymentController {
    static async processPayment(req, res, next) {
        try {
            const result = await payment_service_1.PaymentService.processPayment(req.body, req.user.userId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPayments(req, res, next) {
        try {
            const payments = await payment_model_1.Payment.find()
                .populate('customerId', 'fullName customerCode')
                .populate('chitGroupId', 'groupName');
            res.status(200).json({ success: true, data: payments });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
