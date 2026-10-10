"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chit_group_controller_1 = require("./chit-group.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
// Import nested routers
const chit_member_routes_1 = __importDefault(require("../chit-members/chit-member.routes"));
const chit_cycle_routes_1 = __importDefault(require("../chit-cycles/chit-cycle.routes"));
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Nested routes
router.use('/:groupId/members', chit_member_routes_1.default);
router.use('/:groupId/cycles', chit_cycle_routes_1.default);
// Group routes
router.post('/', (0, authorize_1.authorize)(['chits.create']), chit_group_controller_1.ChitGroupController.createGroup);
router.get('/', (0, authorize_1.authorize)(['chits.read']), chit_group_controller_1.ChitGroupController.getGroups);
exports.default = router;
