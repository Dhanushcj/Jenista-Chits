"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChitPlanController = void 0;
const chit_plan_model_1 = require("./chit-plan.model");
const ApiError_1 = require("../../common/ApiError");
class ChitPlanController {
    static async createPlan(req, res, next) {
        try {
            const existing = await chit_plan_model_1.ChitPlan.findOne({ planCode: req.body.planCode });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Plan code already exists', 'VALIDATION_ERROR');
            }
            // Basic configuration validation can be done in service/engine layer
            const plan = await chit_plan_model_1.ChitPlan.create({
                ...req.body,
                createdBy: req.user?.userId,
            });
            res.status(201).json({ success: true, data: plan });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPublicPlans(req, res, next) {
        try {
            const plans = await chit_plan_model_1.ChitPlan.find({ status: 'ACTIVE' })
                .populate('companyId', 'companyName')
                .populate('branchId', 'branchName');
            res.status(200).json({ success: true, data: plans });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPlans(req, res, next) {
        try {
            const plans = await chit_plan_model_1.ChitPlan.find()
                .populate('companyId', 'companyName')
                .populate('branchId', 'branchName');
            res.status(200).json({ success: true, data: plans });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPlanById(req, res, next) {
        try {
            const plan = await chit_plan_model_1.ChitPlan.findById(req.params.id)
                .populate('companyId', 'companyName')
                .populate('branchId', 'branchName');
            if (!plan) {
                throw new ApiError_1.ApiError(404, 'Plan not found', 'NOT_FOUND');
            }
            res.status(200).json({ success: true, data: plan });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChitPlanController = ChitPlanController;
