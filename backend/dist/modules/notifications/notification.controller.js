"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_model_1 = require("./notification.model");
const notification_service_1 = require("./notification.service");
class NotificationController {
    static async getNotificationsByCustomer(req, res, next) {
        try {
            const { customerId } = req.params;
            const notifications = await notification_model_1.Notification.find({ customerId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: notifications });
        }
        catch (error) {
            next(error);
        }
    }
    static async manuallyQueueNotification(req, res, next) {
        try {
            const notification = await notification_service_1.NotificationService.queueNotification(req.body);
            res.status(201).json({ success: true, data: notification });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
