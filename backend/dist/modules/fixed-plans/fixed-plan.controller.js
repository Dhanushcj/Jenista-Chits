"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedPlanController = void 0;
const fixed_plan_service_1 = require("./fixed-plan.service");
class FixedPlanController {
    static async processCycle(req, res, next) {
        try {
            const { cycleId } = req.params;
            const result = await fixed_plan_service_1.FixedPlanService.processCycle(cycleId, req.user.userId);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FixedPlanController = FixedPlanController;
