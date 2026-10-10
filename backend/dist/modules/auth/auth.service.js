"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../users/user.model");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../common/ApiError");
class AuthService {
    static async login(identifier, password) {
        // identifier can be email or phone
        const user = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        }).populate('roleIds');
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');
        }
        if (user.status !== 'ACTIVE') {
            throw new ApiError_1.ApiError(403, `Account is ${user.status.toLowerCase()}`, 'ACCOUNT_DISABLED');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new ApiError_1.ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');
        }
        user.lastLoginAt = new Date();
        await user.save();
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, roleIds: user.roleIds }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRES });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                userCode: user.userCode,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: user.status,
                roles: user.roleIds
            },
        };
    }
    static async refreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
            const user = await user_model_1.User.findById(decoded.userId).populate('roleIds');
            if (!user || user.status !== 'ACTIVE') {
                throw new ApiError_1.ApiError(401, 'Invalid refresh token', 'UNAUTHORIZED');
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, roleIds: user.roleIds }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRES });
            return { accessToken };
        }
        catch (error) {
            throw new ApiError_1.ApiError(401, 'Invalid or expired refresh token', 'UNAUTHORIZED');
        }
    }
}
exports.AuthService = AuthService;
