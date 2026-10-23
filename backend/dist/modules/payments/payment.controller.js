"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    // Payment Requests (Customer submissions for verification)
    static async createPaymentRequest(req, res, next) {
        try {
            const { PaymentRequestModel } = await Promise.resolve().then(() => __importStar(require('./payment-request.model')));
            const data = req.body;
            if (!data.id) {
                data.id = `PAY-${Date.now().toString().slice(-6)}`;
            }
            const created = await PaymentRequestModel.findOneAndUpdate({ id: data.id }, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });
            res.status(201).json({ success: true, data: created });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPaymentRequests(req, res, next) {
        try {
            const { PaymentRequestModel } = await Promise.resolve().then(() => __importStar(require('./payment-request.model')));
            const { customerId, status } = req.query;
            const query = {};
            if (customerId)
                query.customerId = customerId;
            if (status)
                query.status = status;
            const list = await PaymentRequestModel.find(query).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: list });
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePaymentRequestStatus(req, res, next) {
        try {
            const { PaymentRequestModel } = await Promise.resolve().then(() => __importStar(require('./payment-request.model')));
            const { id } = req.params;
            const updated = await PaymentRequestModel.findOneAndUpdate({ id }, { $set: req.body }, { new: true });
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
