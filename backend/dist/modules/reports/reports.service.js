"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const installment_model_1 = require("../installments/installment.model");
const auction_model_1 = require("../auctions/auction.model");
const payment_model_1 = require("../payments/payment.model");
const chit_member_model_1 = require("../chit-members/chit-member.model");
class ReportsService {
    static async getDefaultersList(params) {
        const { minOverdueAmount, limit, page } = params;
        const skip = (page - 1) * limit;
        const pipeline = [
            { $match: { status: 'OVERDUE', pendingAmount: { $gte: minOverdueAmount } } },
            {
                $group: {
                    _id: '$customerId',
                    totalOverdue: { $sum: '$pendingAmount' },
                    installments: { $push: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            { $unwind: '$customerDetails' },
            { $sort: { totalOverdue: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];
        // Note: Branch filtering would require joining with branches or storing branchId on installments
        const results = await installment_model_1.Installment.aggregate(pipeline);
        return results;
    }
    static async getUpcomingAuctions(params) {
        const { days, limit, page } = params;
        const skip = (page - 1) * limit;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const matchQuery = {
            status: 'SCHEDULED',
            scheduledDate: { $gte: new Date(), $lte: futureDate }
        };
        const results = await auction_model_1.Auction.find(matchQuery)
            .populate('chitGroupId', 'groupName groupCode')
            .sort({ scheduledDate: 1 })
            .skip(skip)
            .limit(limit);
        const total = await auction_model_1.Auction.countDocuments(matchQuery);
        return { results, total, page, limit };
    }
    static async getAgentCollectionReports(params) {
        const { agentId, startDate, endDate, limit, page } = params;
        const skip = (page - 1) * limit;
        const matchQuery = { status: 'SUCCESS' };
        if (agentId) {
            // Find members assigned to this agent
            const members = await chit_member_model_1.ChitMember.find({ agentId: new mongoose_1.default.Types.ObjectId(agentId) });
            const memberIds = members.map(m => m._id);
            matchQuery.chitMemberId = { $in: memberIds };
        }
        if (startDate || endDate) {
            matchQuery.paymentDate = {};
            if (startDate)
                matchQuery.paymentDate.$gte = new Date(startDate);
            if (endDate)
                matchQuery.paymentDate.$lte = new Date(endDate);
        }
        const results = await payment_model_1.Payment.find(matchQuery)
            .populate('customerId', 'fullName')
            .populate('chitGroupId', 'groupName')
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(limit);
        const total = await payment_model_1.Payment.countDocuments(matchQuery);
        return { results, total, page, limit };
    }
}
exports.ReportsService = ReportsService;
