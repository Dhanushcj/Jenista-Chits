"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const payment_model_1 = require("../payments/payment.model");
const installment_model_1 = require("../installments/installment.model");
const chit_member_model_1 = require("../chit-members/chit-member.model");
const ledger_model_1 = require("../ledgers/ledger.model");
class AnalyticsService {
    static async getDashboardMetrics(filters) {
        const { branchId, startDate, endDate } = filters;
        const matchQuery = {};
        if (branchId)
            matchQuery.branchId = new mongoose_1.default.Types.ObjectId(branchId);
        if (startDate || endDate) {
            matchQuery.paymentDate = {};
            if (startDate)
                matchQuery.paymentDate.$gte = new Date(startDate);
            if (endDate)
                matchQuery.paymentDate.$lte = new Date(endDate);
        }
        // 1. Total Collections
        const collections = await payment_model_1.Payment.aggregate([
            { $match: { ...matchQuery, status: 'SUCCESS' } },
            { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
        ]);
        // 2. Overdue Rates
        const overdueInstallments = await installment_model_1.Installment.aggregate([
            { $match: { status: 'OVERDUE' } },
            { $group: { _id: null, totalOverdue: { $sum: '$pendingAmount' } } }
        ]);
        // 3. Active Members Count
        const activeMembers = await chit_member_model_1.ChitMember.countDocuments({ status: 'ACTIVE' });
        // 4. Company Revenue (Commission)
        const revenue = await ledger_model_1.Ledger.aggregate([
            { $match: { accountType: 'COMMISSION' } },
            { $group: { _id: null, totalRevenue: { $sum: '$credit' } } }
        ]);
        return {
            totalCollected: collections[0]?.totalCollected || 0,
            totalOverdue: overdueInstallments[0]?.totalOverdue || 0,
            activeMembers,
            totalRevenue: revenue[0]?.totalRevenue || 0,
        };
    }
    static async getBranchPerformance() {
        return await payment_model_1.Payment.aggregate([
            { $match: { status: 'SUCCESS' } },
            {
                $group: {
                    _id: '$branchId',
                    totalCollections: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branchDetails'
                }
            },
            { $unwind: '$branchDetails' },
            {
                $project: {
                    branchName: '$branchDetails.branchName',
                    totalCollections: 1,
                    transactionCount: 1
                }
            },
            { $sort: { totalCollections: -1 } }
        ]);
    }
}
exports.AnalyticsService = AnalyticsService;
