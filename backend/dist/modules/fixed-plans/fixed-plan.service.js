"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedPlanService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const chit_group_model_1 = require("../chit-groups/chit-group.model");
const chit_cycle_model_1 = require("../chit-cycles/chit-cycle.model");
const chit_member_model_1 = require("../chit-members/chit-member.model");
const payout_model_1 = require("../payouts/payout.model");
const fixed_engine_1 = require("../chit-plans/engines/fixed.engine");
const ApiError_1 = require("../../common/ApiError");
class FixedPlanService {
    static async processCycle(cycleId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const cycle = await chit_cycle_model_1.ChitCycle.findById(cycleId).session(session);
            if (!cycle)
                throw new ApiError_1.ApiError(404, 'Cycle not found', 'NOT_FOUND');
            if (cycle.planType !== 'FIXED')
                throw new ApiError_1.ApiError(400, 'Not a fixed plan cycle', 'INVALID_OPERATION');
            if (cycle.status === 'CLOSED')
                throw new ApiError_1.ApiError(400, 'Cycle already closed', 'INVALID_OPERATION');
            const group = await chit_group_model_1.ChitGroup.findById(cycle.chitGroupId).session(session);
            if (!group)
                throw new ApiError_1.ApiError(404, 'Group not found', 'NOT_FOUND');
            const engine = new fixed_engine_1.FixedPlanEngine(group.planSnapshot);
            if (!engine.validateCycle(cycle)) {
                throw new ApiError_1.ApiError(400, 'Cycle validation failed', 'VALIDATION_ERROR');
            }
            // Determine eligible members (for fixed plans, let's assume one payout per month or configurable)
            // For simplicity, we find the next member who hasn't taken a prize and is ACTIVE
            const eligibleMember = await chit_member_model_1.ChitMember.findOne({
                chitGroupId: group._id,
                status: 'ACTIVE',
                prizeTaken: false
            }).sort({ ticketNumber: 1 }).session(session);
            let createdPayout = null;
            if (eligibleMember) {
                const engineResult = await engine.processCycle(cycle);
                const calc = engineResult.payoutCalculation;
                const payoutNumber = `PAYOUT-F-${Date.now()}`;
                const payout = await payout_model_1.Payout.create([{
                        payoutNumber,
                        customerId: eligibleMember.customerId,
                        chitGroupId: group._id,
                        chitMemberId: eligibleMember._id,
                        cycleId: cycle._id,
                        planType: 'FIXED',
                        grossAmount: calc.grossAmount,
                        deductions: calc.deductions,
                        netAmount: calc.netAmount,
                        status: 'PENDING',
                        approvedBy: userId
                    }], { session });
                eligibleMember.prizeTaken = true;
                eligibleMember.prizeCycleId = cycle._id;
                await eligibleMember.save({ session });
                createdPayout = payout[0];
            }
            // Close cycle
            cycle.status = 'CLOSED';
            await cycle.save({ session });
            group.currentCycle = cycle.cycleNumber;
            await group.save({ session });
            // TODO: Create Ledger entries
            await session.commitTransaction();
            session.endSession();
            return {
                message: 'Fixed cycle processed successfully',
                payout: createdPayout
            };
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}
exports.FixedPlanService = FixedPlanService;
