"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentController = void 0;
const installment_model_1 = require("./installment.model");
class InstallmentController {
    static async getInstallments(req, res, next) {
        try {
            const { customerId, chitGroupId, status } = req.query;
            const filter = {};
            if (customerId)
                filter.customerId = customerId;
            if (chitGroupId)
                filter.chitGroupId = chitGroupId;
            if (status)
                filter.status = status;
            const installments = await installment_model_1.Installment.find(filter)
                .populate('chitGroupId', 'groupName groupCode')
                .populate('cycleId', 'cycleNumber dueDate')
                .sort({ dueDate: 1 });
            res.status(200).json({ success: true, data: installments });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InstallmentController = InstallmentController;
