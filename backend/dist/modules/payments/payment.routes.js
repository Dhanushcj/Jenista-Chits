"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
// Customer payment verification requests (Public/Customer accessible routes)
router.post('/requests', payment_controller_1.PaymentController.createPaymentRequest);
router.get('/requests', payment_controller_1.PaymentController.getPaymentRequests);
router.patch('/requests/:id', payment_controller_1.PaymentController.updatePaymentRequestStatus);
// Internal Ledger Payments
router.use(authenticate_1.authenticate);
router.post('/', (0, authorize_1.authorize)(['payments.create']), payment_controller_1.PaymentController.processPayment);
router.get('/', (0, authorize_1.authorize)(['payments.read']), payment_controller_1.PaymentController.getPayments);
exports.default = router;
