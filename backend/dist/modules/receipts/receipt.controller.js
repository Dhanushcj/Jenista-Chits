"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptController = void 0;
const receipt_model_1 = require("./receipt.model");
class ReceiptController {
    static async getReceipts(req, res, next) {
        try {
            const { customerId, chitGroupId } = req.query;
            const filter = {};
            if (customerId)
                filter.customerId = customerId;
            if (chitGroupId)
                filter.chitGroupId = chitGroupId;
            const receipts = await receipt_model_1.Receipt.find(filter)
                .populate('paymentId')
                .populate('customerId', 'fullName customerCode');
            res.status(200).json({ success: true, data: receipts });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReceiptController = ReceiptController;
