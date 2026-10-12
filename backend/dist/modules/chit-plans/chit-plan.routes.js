"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chit_plan_controller_1 = require("./chit-plan.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', chit_plan_controller_1.ChitPlanController.getPublicPlans);
// Protected routes
router.use(authenticate_1.authenticate);
router.post('/', (0, authorize_1.authorize)(['plans.create']), chit_plan_controller_1.ChitPlanController.createPlan);
router.get('/', (0, authorize_1.authorize)(['plans.read']), chit_plan_controller_1.ChitPlanController.getPlans);
router.get('/:id', (0, authorize_1.authorize)(['plans.read']), chit_plan_controller_1.ChitPlanController.getPlanById);
exports.default = router;
