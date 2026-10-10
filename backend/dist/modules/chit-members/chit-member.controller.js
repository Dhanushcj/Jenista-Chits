"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChitMemberController = void 0;
const chit_member_model_1 = require("./chit-member.model");
const ApiError_1 = require("../../common/ApiError");
class ChitMemberController {
    static async addMember(req, res, next) {
        try {
            const { groupId } = req.params;
            const { customerId, ticketNumber, installmentAmount, agentId } = req.body;
            const existing = await chit_member_model_1.ChitMember.findOne({ chitGroupId: groupId, ticketNumber });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Ticket number already taken in this group', 'VALIDATION_ERROR');
            }
            const member = await chit_member_model_1.ChitMember.create({
                chitGroupId: groupId,
                customerId,
                ticketNumber,
                installmentAmount,
                agentId,
            });
            res.status(201).json({ success: true, data: member });
        }
        catch (error) {
            next(error);
        }
    }
    static async getMembersByGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const members = await chit_member_model_1.ChitMember.find({ chitGroupId: groupId })
                .populate('customerId', 'fullName customerCode phone')
                .populate('agentId', 'name phone');
            res.status(200).json({ success: true, data: members });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChitMemberController = ChitMemberController;
