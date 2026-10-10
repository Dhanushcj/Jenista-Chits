"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const company_model_1 = require("./company.model");
const ApiError_1 = require("../../common/ApiError");
class CompanyController {
    static async createCompany(req, res, next) {
        try {
            const existing = await company_model_1.Company.findOne({ companyCode: req.body.companyCode });
            if (existing) {
                throw new ApiError_1.ApiError(400, 'Company code already exists', 'VALIDATION_ERROR');
            }
            const company = await company_model_1.Company.create(req.body);
            res.status(201).json({ success: true, data: company });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCompanies(req, res, next) {
        try {
            const companies = await company_model_1.Company.find();
            res.status(200).json({ success: true, data: companies });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CompanyController = CompanyController;
