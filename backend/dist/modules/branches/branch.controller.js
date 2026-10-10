"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchController = void 0;
const branch_model_1 = require("./branch.model");
const ApiError_1 = require("../../common/ApiError");
class BranchController {
    static async createBranch(req, res, next) {
        try {
            const existing = await branch_model_1.Branch.findOne({ branchCode: req.body.branchCode });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Branch code already exists', 'VALIDATION_ERROR');
            }
            const branch = await branch_model_1.Branch.create(req.body);
            res.status(201).json({ success: true, data: branch });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranches(req, res, next) {
        try {
            const branches = await branch_model_1.Branch.find().populate('companyId').populate('managerId', 'name email phone');
            res.status(200).json({ success: true, data: branches });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BranchController = BranchController;
