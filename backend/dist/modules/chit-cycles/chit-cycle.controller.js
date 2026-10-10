"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChitCycleController = void 0;
const chit_cycle_model_1 = require("./chit-cycle.model");
const ApiError_1 = require("../../common/ApiError");
class ChitCycleController {
    static async createCycle(req, res, next) {
        try {
            const { groupId } = req.params;
            const { cycleNumber, dueDate, planType, auctionDate, expectedCollection } = req.body;
            const existing = await chit_cycle_model_1.ChitCycle.findOne({ chitGroupId: groupId, cycleNumber });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Cycle number already exists for this group', 'VALIDATION_ERROR');
            }
            const cycle = await chit_cycle_model_1.ChitCycle.create({
                chitGroupId: groupId,
                cycleNumber,
                dueDate,
                planType,
                auctionDate,
                expectedCollection,
            });
            res.status(201).json({ success: true, data: cycle });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCyclesByGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const cycles = await chit_cycle_model_1.ChitCycle.find({ chitGroupId: groupId }).sort({ cycleNumber: 1 });
            res.status(200).json({ success: true, data: cycles });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChitCycleController = ChitCycleController;
