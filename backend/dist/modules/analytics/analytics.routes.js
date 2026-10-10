"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// We'll require a specific role/permission to view top-level company analytics
router.get('/dashboard', (0, authorize_1.authorize)(['analytics.read']), analytics_controller_1.AnalyticsController.getDashboardMetrics);
router.get('/branch-performance', (0, authorize_1.authorize)(['analytics.read']), analytics_controller_1.AnalyticsController.getBranchPerformance);
exports.default = router;
