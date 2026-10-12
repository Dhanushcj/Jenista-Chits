"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("./customer.controller");
const router = (0, express_1.Router)();
// Public route for customer registration
router.post('/', customer_controller_1.CustomerController.createCustomer);
// Public route for customer login
router.post('/login', customer_controller_1.CustomerController.customerLogin);
// Customer list (allows filtering by status, search, etc.)
router.get('/', customer_controller_1.CustomerController.getCustomers);
// Update customer status (e.g. approve / reject)
router.patch('/:id/status', customer_controller_1.CustomerController.updateCustomerStatus);
exports.default = router;
