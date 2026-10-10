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
exports.Installment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InstallmentSchema = new mongoose_1.Schema({
    chitGroupId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitGroup', required: true },
    chitMemberId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitMember', required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    cycleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitCycle', required: true },
    cycleNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    dueAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED'],
        default: 'PENDING',
    },
    paidAt: { type: Date },
}, { timestamps: true });
InstallmentSchema.index({ chitMemberId: 1, cycleId: 1 }, { unique: true });
InstallmentSchema.index({ customerId: 1 });
InstallmentSchema.index({ dueDate: 1 });
InstallmentSchema.index({ status: 1 });
exports.Installment = mongoose_1.default.model('Installment', InstallmentSchema);
