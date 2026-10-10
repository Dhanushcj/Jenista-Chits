"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_model_1 = require("./customer.model");
const ApiError_1 = require("../../common/ApiError");
class CustomerController {
    static async createCustomer(req, res, next) {
        try {
            const existing = await customer_model_1.Customer.findOne({ customerCode: req.body.customerCode });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Customer code already exists', 'VALIDATION_ERROR');
            }
            const customer = await customer_model_1.Customer.create({
                ...req.body,
                createdBy: req.user?.userId,
            });
            res.status(201).json({ success: true, data: customer });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCustomers(req, res, next) {
        try {
            const { branchId, assignedAgentId, search } = req.query;
            const filter = {};
            if (branchId)
                filter.branchId = branchId;
            if (assignedAgentId)
                filter.assignedAgentId = assignedAgentId;
            if (search) {
                filter.$or = [
                    { fullName: { $regex: search, $options: 'i' } },
                    { customerCode: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ];
            }
            const customers = await customer_model_1.Customer.find(filter)
                .populate('branchId', 'branchName branchCode')
                .populate('assignedAgentId', 'name phone');
            res.status(200).json({ success: true, data: customers });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
