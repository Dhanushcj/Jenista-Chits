"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("./user.model");
const ApiError_1 = require("../../common/ApiError");
class UserController {
    static async createUser(req, res, next) {
        try {
            const { userCode, name, email, phone, password, roleIds, branchIds } = req.body;
            const existingUser = await user_model_1.User.findOne({ $or: [{ userCode }, { phone }, { email }] });
            if (existingUser) {
                throw new ApiError_1.ApiError(400, 'User with code, phone, or email already exists', 'VALIDATION_ERROR');
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 12);
            const user = await user_model_1.User.create({
                userCode,
                name,
                email,
                phone,
                passwordHash,
                roleIds,
                branchIds,
            });
            const userResponse = user.toObject();
            delete userResponse.passwordHash;
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userResponse,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUsers(req, res, next) {
        try {
            const users = await user_model_1.User.find().select('-passwordHash').populate('roleIds');
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
