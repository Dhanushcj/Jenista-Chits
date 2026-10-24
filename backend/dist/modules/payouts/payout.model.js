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
exports.Payout = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PayoutSchema = new mongoose_1.Schema({
    payoutNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    chitGroupId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitGroup', required: true },
    chitMemberId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitMember', required: true },
    cycleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitCycle', required: true },
    auctionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Auction' },
    planType: { type: String, enum: ['FIXED', 'AUCTION'], required: true },
    grossAmount: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paymentMethod: { type: String },
    bankReference: { type: String },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
        default: 'PENDING',
    },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    processedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
}, { timestamps: true });
PayoutSchema.index({ chitGroupId: 1, cycleId: 1 });
exports.Payout = mongoose_1.default.model('Payout', PayoutSchema);
