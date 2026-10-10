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
exports.Auction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AuctionSchema = new mongoose_1.Schema({
    auctionNumber: { type: String, required: true, unique: true },
    chitGroupId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitGroup', required: true },
    cycleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitCycle', required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String },
    status: {
        type: String,
        enum: ['SCHEDULED', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'FINALIZED', 'CANCELLED'],
        default: 'SCHEDULED',
    },
    totalChitValue: { type: Number, required: true },
    minimumBid: { type: Number, required: true },
    maximumBid: { type: Number, required: true },
    winnerRule: { type: String, required: true },
    winningBid: { type: Number },
    winnerMemberId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChitMember' },
    prizeAmount: { type: Number },
    commissionAmount: { type: Number },
    dividendAmount: { type: Number },
    conductedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    finalizedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    finalizedAt: { type: Date },
}, { timestamps: true });
AuctionSchema.index({ chitGroupId: 1, cycleId: 1 }, { unique: true });
AuctionSchema.index({ status: 1 });
AuctionSchema.index({ scheduledDate: 1 });
exports.Auction = mongoose_1.default.model('Auction', AuctionSchema);
