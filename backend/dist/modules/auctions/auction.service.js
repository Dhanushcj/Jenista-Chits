"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auction_model_1 = require("./auction.model");
const auction_bid_model_1 = require("../auction-bids/auction-bid.model");
const chit_group_model_1 = require("../chit-groups/chit-group.model");
const chit_member_model_1 = require("../chit-members/chit-member.model");
const chit_cycle_model_1 = require("../chit-cycles/chit-cycle.model");
const payout_model_1 = require("../payouts/payout.model");
const auction_engine_1 = require("../chit-plans/engines/auction.engine");
const ApiError_1 = require("../../common/ApiError");
class AuctionService {
    static async submitBid(auctionId, memberId, bidAmount, userId) {
        const auction = await auction_model_1.Auction.findById(auctionId);
        if (!auction)
            throw new ApiError_1.ApiError(404, 'Auction not found', 'NOT_FOUND');
        if (auction.status !== 'OPEN' && auction.status !== 'IN_PROGRESS') {
            throw new ApiError_1.ApiError(400, 'Auction is not open for bidding', 'INVALID_OPERATION');
        }
        if (bidAmount < auction.minimumBid || bidAmount > auction.maximumBid) {
            throw new ApiError_1.ApiError(400, `Bid must be between ${auction.minimumBid} and ${auction.maximumBid}`, 'VALIDATION_ERROR');
        }
        const member = await chit_member_model_1.ChitMember.findById(memberId);
        if (!member)
            throw new ApiError_1.ApiError(404, 'Member not found', 'NOT_FOUND');
        if (member.status !== 'ACTIVE')
            throw new ApiError_1.ApiError(400, 'Member is not active', 'INVALID_OPERATION');
        if (member.prizeTaken)
            throw new ApiError_1.ApiError(400, 'Member has already taken a prize', 'INVALID_OPERATION');
        const bid = await auction_bid_model_1.AuctionBid.create({
            auctionId,
            chitGroupId: auction.chitGroupId,
            memberId,
            customerId: member.customerId,
            bidAmount,
            submittedBy: userId,
            status: 'VALID',
        });
        return bid;
    }
    static async finalizeAuction(auctionId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const auction = await auction_model_1.Auction.findById(auctionId).session(session);
            if (!auction)
                throw new ApiError_1.ApiError(404, 'Auction not found', 'NOT_FOUND');
            if (auction.status === 'FINALIZED')
                throw new ApiError_1.ApiError(400, 'Auction already finalized', 'INVALID_OPERATION');
            const bids = await auction_bid_model_1.AuctionBid.find({ auctionId, status: 'VALID' }).sort({ bidAmount: -1 }).session(session);
            if (bids.length === 0) {
                throw new ApiError_1.ApiError(400, 'No valid bids to finalize', 'INVALID_OPERATION');
            }
            // Simple winner logic based on HIGHEST_DISCOUNT (highest bidAmount)
            // Since it's sorted descending, [0] is the highest bid
            const winningBid = bids[0];
            const group = await chit_group_model_1.ChitGroup.findById(auction.chitGroupId).session(session);
            const cycle = await chit_cycle_model_1.ChitCycle.findById(auction.cycleId).session(session);
            const engine = new auction_engine_1.AuctionPlanEngine(group.planSnapshot);
            const calc = engine.calculatePayout({
                chitValue: auction.totalChitValue,
                winningBid: winningBid.bidAmount
            });
            // Update Auction
            auction.winningBid = winningBid.bidAmount;
            auction.winnerMemberId = winningBid.memberId;
            auction.prizeAmount = calc.netAmount;
            auction.commissionAmount = calc.commission;
            auction.dividendAmount = calc.dividend;
            auction.status = 'FINALIZED';
            auction.finalizedBy = new mongoose_1.default.Types.ObjectId(userId);
            auction.finalizedAt = new Date();
            await auction.save({ session });
            // Update Bid
            winningBid.status = 'WINNING';
            await winningBid.save({ session });
            // Update Member
            const member = await chit_member_model_1.ChitMember.findById(winningBid.memberId).session(session);
            member.prizeTaken = true;
            member.prizeCycleId = cycle._id;
            await member.save({ session });
            // Create Payout
            const payoutNumber = `PAYOUT-A-${Date.now()}`;
            await payout_model_1.Payout.create([{
                    payoutNumber,
                    customerId: winningBid.customerId,
                    chitGroupId: auction.chitGroupId,
                    chitMemberId: winningBid.memberId,
                    cycleId: auction.cycleId,
                    auctionId: auction._id,
                    planType: 'AUCTION',
                    grossAmount: calc.grossAmount,
                    deductions: calc.discount,
                    netAmount: calc.netAmount,
                    status: 'PENDING',
                    approvedBy: new mongoose_1.default.Types.ObjectId(userId)
                }], { session });
            // Close cycle
            cycle.status = 'AUCTION_COMPLETED';
            await cycle.save({ session });
            // TODO: Create Dividend records
            // TODO: Create Ledger entries
            // TODO: Audit Logs
            await session.commitTransaction();
            session.endSession();
            return auction;
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}
exports.AuctionService = AuctionService;
