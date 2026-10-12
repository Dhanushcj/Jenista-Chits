"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_model_1 = require("./customer.model");
const ApiError_1 = require("../../common/ApiError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class CustomerController {
    static async createCustomer(req, res, next) {
        try {
            const { name, mobile, address, password } = req.body;
            const phone = mobile || req.body.phone;
            const fullName = name || req.body.fullName;
            if (!phone || !fullName) {
                throw new ApiError_1.ApiError(400, 'Name and Mobile are required', 'VALIDATION_ERROR');
            }
            const existing = await customer_model_1.Customer.findOne({ phone });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Customer with this mobile already exists', 'VALIDATION_ERROR');
            }
            let passwordHash;
            if (password) {
                passwordHash = await bcryptjs_1.default.hash(password, 10);
            }
            const customerCode = req.body.customerCode || `TC-${Math.floor(Math.random() * 90000) + 10000}`;
            const customer = await customer_model_1.Customer.create({
                ...req.body,
                customerCode,
                fullName,
                phone,
                address: address || req.body.address,
                passwordHash,
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
