"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const role_model_1 = require("../modules/roles/role.model");
const ApiError_1 = require("../common/ApiError");
const authorize = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError_1.ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
            }
            // Fetch user's roles
            const roles = await role_model_1.Role.find({ _id: { $in: req.user.roleIds }, status: 'ACTIVE' });
            const userPermissions = new Set();
            roles.forEach(role => {
                role.permissions.forEach(permission => userPermissions.add(permission));
            });
            const hasPermission = requiredPermissions.every(permission => userPermissions.has(permission));
            if (!hasPermission) {
                throw new ApiError_1.ApiError(403, 'Forbidden: Insufficient permissions', 'FORBIDDEN');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
