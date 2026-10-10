"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const user_model_1 = require("../users/user.model");
const role_model_1 = require("../roles/role.model");
class AgentController {
    static async getAgents(req, res, next) {
        try {
            const role = await role_model_1.Role.findOne({ code: 'COLLECTION_AGENT' });
            if (!role) {
                return res.status(200).json({ success: true, data: [] });
            }
            const agents = await user_model_1.User.find({ roleIds: role._id }).select('-passwordHash');
            res.status(200).json({ success: true, data: agents });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AgentController = AgentController;
