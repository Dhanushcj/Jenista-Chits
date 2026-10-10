"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const user_model_1 = require("../users/user.model");
const role_model_1 = require("../roles/role.model");
class StaffController {
    static async getStaff(req, res, next) {
        try {
            // Find roles that map to 'STAFF' conceptually, e.g. code: 'STAFF'
            const role = await role_model_1.Role.findOne({ code: 'STAFF' });
            if (!role) {
                return res.status(200).json({ success: true, data: [] });
            }
            const staff = await user_model_1.User.find({ roleIds: role._id }).select('-passwordHash');
            res.status(200).json({ success: true, data: staff });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StaffController = StaffController;
