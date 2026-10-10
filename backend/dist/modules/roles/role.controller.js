"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const role_model_1 = require("./role.model");
const ApiError_1 = require("../../common/ApiError");
class RoleController {
    static async createRole(req, res, next) {
        try {
            const { code, name, description, permissions } = req.body;
            const existingRole = await role_model_1.Role.findOne({ code });
            if (existingRole) {
                throw new ApiError_1.ApiError(400, 'Role code already exists', 'VALIDATION_ERROR');
            }
            const role = await role_model_1.Role.create({ code, name, description, permissions });
            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: role,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getRoles(req, res, next) {
        try {
            const roles = await role_model_1.Role.find();
            res.status(200).json({
                success: true,
                data: roles,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RoleController = RoleController;
