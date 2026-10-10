"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionController = void 0;
const auction_service_1 = require("./auction.service");
const auction_model_1 = require("./auction.model");
class AuctionController {
    static async submitBid(req, res, next) {
        try {
            const { id } = req.params;
            const { memberId, bidAmount } = req.body;
            const bid = await auction_service_1.AuctionService.submitBid(id, memberId, bidAmount, req.user.userId);
            res.status(201).json({ success: true, data: bid });
        }
        catch (error) {
            next(error);
        }
    }
    static async finalizeAuction(req, res, next) {
        try {
            const { id } = req.params;
            const auction = await auction_service_1.AuctionService.finalizeAuction(id, req.user.userId);
            res.status(200).json({ success: true, data: auction });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAuctions(req, res, next) {
        try {
            const auctions = await auction_model_1.Auction.find().populate('chitGroupId', 'groupName groupCode');
            res.status(200).json({ success: true, data: auctions });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuctionController = AuctionController;
