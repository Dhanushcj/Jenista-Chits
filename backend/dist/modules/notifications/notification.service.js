"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_model_1 = require("./notification.model");
const ApiError_1 = require("../../common/ApiError");
class NotificationService {
    /**
     * Pushes a notification to the database.
     * In a real system, a cron job or queue consumer would read PENDING notifications and send them via SMS/Email APIs.
     */
    static async queueNotification(data) {
        try {
            const notification = await notification_model_1.Notification.create({
                ...data,
                status: 'PENDING',
            });
            return notification;
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, 'Failed to queue notification', 'INTERNAL_SERVER_ERROR');
        }
    }
    static async markAsSent(notificationId) {
        return await notification_model_1.Notification.findByIdAndUpdate(notificationId, {
            status: 'SENT',
            sentAt: new Date()
        }, { new: true });
    }
}
exports.NotificationService = NotificationService;
