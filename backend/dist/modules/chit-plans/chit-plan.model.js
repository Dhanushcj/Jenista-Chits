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
exports.ChitPlan = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ChitPlanSchema = new mongoose_1.Schema({
    planCode: { type: String, required: true, unique: true },
    planName: { type: String, required: true },
    planType: { type: String, enum: ['FIXED', 'AUCTION'], required: true },
    description: { type: String },
    chitValue: { type: Number, required: true },
    memberCount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    monthlyInstallment: { type: Number, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    configuration: { type: mongoose_1.Schema.Types.Mixed, required: true }, // Flexible rules config
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
        default: 'DRAFT',
    },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
ChitPlanSchema.index({ planType: 1 });
ChitPlanSchema.index({ status: 1 });
exports.ChitPlan = mongoose_1.default.model('ChitPlan', ChitPlanSchema);
