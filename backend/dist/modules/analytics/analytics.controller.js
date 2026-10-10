"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
class AnalyticsController {
    static async getDashboardMetrics(req, res, next) {
        try {
            const { branchId, startDate, endDate } = req.query;
            const metrics = await analytics_service_1.AnalyticsService.getDashboardMetrics({
                branchId: branchId,
                startDate: startDate,
                endDate: endDate
            });
            res.status(200).json({ success: true, data: metrics });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchPerformance(req, res, next) {
        try {
            const performance = await analytics_service_1.AnalyticsService.getBranchPerformance();
            res.status(200).json({ success: true, data: performance });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
