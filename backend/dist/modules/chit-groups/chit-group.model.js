"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChitGroup = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ChitGroupSchema = new mongoose_1.Schema({
    groupCode: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitPlan', required: true },
    planType: { type: String, enum: ['FIXED', 'AUCTION'], required: true },
    chitValue: { type: Number, required: true },
    memberCount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    monthlyInstallment: { type: Number, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    currentCycle: { type: Number, default: 0 },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch', required: true },
    status: {
        type: String,
        enum: ['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED'],
        default: 'DRAFT',
    },
    planSnapshot: { type: mongoose_1.Schema.Types.Mixed, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
ChitGroupSchema.index({ groupCode: 1 });
ChitGroupSchema.index({ planId: 1 });
ChitGroupSchema.index({ branchId: 1 });
ChitGroupSchema.index({ status: 1 });
exports.ChitGroup = mongoose_1.default.model('ChitGroup', ChitGroupSchema);
