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
exports.PaymentRequestModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentRequestSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    mobile: { type: String },
    groupId: { type: String, required: true },
    groupName: { type: String },
    ticketNumber: { type: String },
    amount: { type: Number, required: true },
    paymentMode: { type: String, required: true },
    referenceNo: { type: String, required: true },
    bankAccountId: { type: String },
    bankName: { type: String },
    paymentScreenshot: { type: String },
    screenshotUrl: { type: String },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    status: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'APPROVED', 'REJECTED'],
        default: 'PENDING_VERIFICATION',
    },
    remarks: { type: String },
    verifiedAt: { type: String },
    rejectedAt: { type: String },
}, { timestamps: true });
PaymentRequestSchema.index({ id: 1 });
PaymentRequestSchema.index({ customerId: 1 });
PaymentRequestSchema.index({ status: 1 });
exports.PaymentRequestModel = mongoose_1.default.model('PaymentRequest', PaymentRequestSchema);
