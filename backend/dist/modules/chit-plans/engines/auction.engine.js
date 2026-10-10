"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionPlanEngine = void 0;
const base_engine_1 = require("./base.engine");
class AuctionPlanEngine extends base_engine_1.ChitPlanEngine {
    constructor(configuration) {
        super(configuration);
    }
    validateMembership(memberData) {
        return true;
    }
    calculateInstallment(cycleData) {
        // Auction installment can vary based on dividend
        // Standard logic before dividend is just the base installment
        return this.configuration.installmentAmount || 0;
    }
    validateCycle(cycleData) {
        return true;
    }
    calculatePayout(data) {
        // Prize amount is usually chitValue - winningBid (discount)
        const chitValue = data.chitValue;
        const winningBid = data.winningBid; // aka discount
        const prizeAmount = chitValue - winningBid;
        let commission = 0;
        if (this.configuration.commissionRule?.type === 'PERCENTAGE') {
            commission = (chitValue * this.configuration.commissionRule.value) / 100;
        }
        const dividend = winningBid - commission;
        return {
            grossAmount: chitValue,
            discount: winningBid,
            commission,
            dividend,
            netAmount: prizeAmount - commission,
        };
    }
    async processCycle(cycleData) {
        // Open auction, accept bids... (placeholder for structural purposes)
        return { success: true, type: 'AUCTION_CYCLE_PROCESSED' };
    }
}
exports.AuctionPlanEngine = AuctionPlanEngine;
