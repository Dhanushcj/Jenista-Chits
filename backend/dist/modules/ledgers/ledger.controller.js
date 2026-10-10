"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerController = void 0;
const ledger_model_1 = require("./ledger.model");
class LedgerController {
    static async getLedgerEntries(req, res, next) {
        try {
            const { accountType, entityId, branchId } = req.query;
            const filter = {};
            if (accountType)
                filter.accountType = accountType;
            if (entityId)
                filter.entityId = entityId;
            if (branchId)
                filter.branchId = branchId;
            const entries = await ledger_model_1.Ledger.find(filter)
                .sort({ date: -1, createdAt: -1 })
                .limit(100);
            res.status(200).json({ success: true, data: entries });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LedgerController = LedgerController;
