"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChitGroupController = void 0;
const chit_group_model_1 = require("./chit-group.model");
const chit_plan_model_1 = require("../chit-plans/chit-plan.model");
const ApiError_1 = require("../../common/ApiError");
class ChitGroupController {
    static async createGroup(req, res, next) {
        try {
            const existing = await chit_group_model_1.ChitGroup.findOne({ groupCode: req.body.groupCode });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Group code already exists', 'VALIDATION_ERROR');
            }
            // Snapshot the plan config
            const plan = await chit_plan_model_1.ChitPlan.findById(req.body.planId);
            if (!plan) {
                throw new ApiError_1.ApiError(404, 'Plan not found', 'NOT_FOUND');
            }
            const group = await chit_group_model_1.ChitGroup.create({
                ...req.body,
                planType: plan.planType,
                planSnapshot: plan.configuration,
                createdBy: req.user?.userId,
            });
            res.status(201).json({ success: true, data: group });
        }
        catch (error) {
            next(error);
        }
    }
    static async getGroups(req, res, next) {
        try {
            const groups = await chit_group_model_1.ChitGroup.find()
                .populate('planId', 'planName planCode')
                .populate('branchId', 'branchName');
            res.status(200).json({ success: true, data: groups });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChitGroupController = ChitGroupController;
