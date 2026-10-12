"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("./customer.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
// Public route for customer registration
router.post('/', customer_controller_1.CustomerController.createCustomer);
// Protected routes
router.use(authenticate_1.authenticate);
router.get('/', (0, authorize_1.authorize)(['customers.read']), customer_controller_1.CustomerController.getCustomers);
exports.default = router;
