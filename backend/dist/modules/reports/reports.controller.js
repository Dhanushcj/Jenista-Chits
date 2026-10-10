"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
class ReportsController {
    static async getDefaultersList(req, res, next) {
        try {
            const { branchId, minOverdueAmount, limit, page } = req.query;
            const result = await reports_service_1.ReportsService.getDefaultersList({
                branchId: branchId,
                minOverdueAmount: minOverdueAmount ? Number(minOverdueAmount) : 0,
                limit: limit ? Number(limit) : 20,
                page: page ? Number(page) : 1
            });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUpcomingAuctions(req, res, next) {
        try {
            const { branchId, days, limit, page } = req.query;
            const result = await reports_service_1.ReportsService.getUpcomingAuctions({
                branchId: branchId,
                days: days ? Number(days) : 30,
                limit: limit ? Number(limit) : 20,
                page: page ? Number(page) : 1
            });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAgentCollectionReports(req, res, next) {
        try {
            const { agentId, startDate, endDate, limit, page } = req.query;
            const result = await reports_service_1.ReportsService.getAgentCollectionReports({
                agentId: agentId,
                startDate: startDate,
                endDate: endDate,
                limit: limit ? Number(limit) : 20,
                page: page ? Number(page) : 1
            });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportsController = ReportsController;
