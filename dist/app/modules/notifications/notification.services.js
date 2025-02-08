"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationServices = void 0;
const firebaseAdmin_1 = __importDefault(require("../../../helpers/firebaseAdmin"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
// Send notification to a single user
const sendSingleNotification = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: req.params.userId },
    });
    if (!(user === null || user === void 0 ? void 0 : user.fcmToken)) {
        throw new ApiErrors_1.default(404, "User not found with FCM token");
    }
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        token: user.fcmToken,
    };
    try {
        const response = yield firebaseAdmin_1.default.messaging().send(message);
        yield prisma_1.default.notifications.create({
            data: {
                receiverId: req.params.userId,
                title: req.body.title,
                body: req.body.body,
            },
        });
        return response;
    }
    catch (error) {
        if (error.code === "messaging/invalid-registration-token") {
            throw new ApiErrors_1.default(400, "Invalid FCM registration token");
        }
        else if (error.code === "messaging/registration-token-not-registered") {
            throw new ApiErrors_1.default(404, "FCM token is no longer registered");
        }
        else {
            throw new ApiErrors_1.default(500, "Failed to send notification");
        }
    }
});
// Send notifications to all users with valid FCM tokens
const sendNotifications = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma_1.default.user.findMany({
        where: {
            fcmToken: {
                not: null, // Ensure the token is not null
            },
        },
        select: {
            id: true,
            fcmToken: true,
        },
    });
    if (!users || users.length === 0) {
        throw new ApiErrors_1.default(404, "No users found with FCM tokens");
    }
    const fcmTokens = users.map((user) => user.fcmToken);
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        tokens: fcmTokens,
    };
    const response = yield firebaseAdmin_1.default.messaging().sendEachForMulticast(message);
    // Find indices of successful responses
    const successIndices = response.responses
        .map((res, idx) => (res.success ? idx : null))
        .filter((idx) => idx !== null);
    // Filter users by success indices
    const successfulUsers = successIndices.map((idx) => users[idx]);
    if (successfulUsers.length === 0) {
        throw new ApiErrors_1.default(500, "Failed to send notifications to some users");
    }
    // Prepare notifications data for only successfully notified users
    const notificationData = successfulUsers.map((user) => ({
        receiverId: user === null || user === void 0 ? void 0 : user.id,
        title: req.body.title,
        body: req.body.body,
    }));
    // Save notifications for successfully notified users
    yield prisma_1.default.notifications.createMany({
        data: notificationData,
    });
    // Collect failed tokens
    const failedTokens = response.responses
        .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
        .filter((token) => token !== null);
    return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
    };
});
const sendChannelNofitications = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = req.params.channelId;
    const channel = yield prisma_1.default.chanel.findUnique({
        where: { id: channelId },
        select: { memberIds: true },
    });
    if (!channel) {
        throw new ApiErrors_1.default(404, "Channel not found");
    }
    const channelInfo = yield prisma_1.default.chanel.findUnique({
        where: { id: channelId },
    });
    const members = yield prisma_1.default.user.findMany({
        where: {
            id: { in: channel.memberIds },
        },
    });
    const fcmTokens = members.map((user) => user.fcmToken);
    const message = {
        notification: {
            title: `get notification in ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.chanelName}`,
            body: req.body.body,
        },
        tokens: fcmTokens,
    };
    const response = yield firebaseAdmin_1.default.messaging().sendEachForMulticast(message);
    // Find indices of successful responses
    const successIndices = response.responses
        .map((res, idx) => (res.success ? idx : null))
        .filter((idx) => idx !== null);
    // Filter users by success indices
    const successfulUsers = successIndices.map((idx) => members[idx]);
    if (successfulUsers.length === 0) {
        throw new ApiErrors_1.default(500, "Failed to send notifications to some users");
    }
    // Prepare notifications data for only successfully notified users
    const notificationData = successfulUsers.map((user) => ({
        receiverId: user === null || user === void 0 ? void 0 : user.id,
        channelId: channelId,
        title: `get notification in ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.chanelName}`,
        body: req.body.body,
    }));
    // Save notifications for successfully notified users
    yield prisma_1.default.notifications.createMany({
        data: notificationData,
    });
    // Collect failed tokens
    const failedTokens = response.responses
        .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
        .filter((token) => token !== null);
    return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
    };
});
const getNotificationsFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = yield prisma_1.default.notifications.findMany({
        where: {
            receiverId: req.user.id,
        },
        orderBy: { createdAt: "desc" },
        include: {
            channel: {
                select: {
                    chanelImage: true,
                    description: true,
                    chanelName: true,
                },
            },
        },
    });
    if (notifications.length === 0) {
        throw new ApiErrors_1.default(404, "No notifications found for the user");
    }
    return notifications;
});
const getSingleNotificationFromDB = (req, notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield prisma_1.default.notifications.findFirst({
        where: {
            id: notificationId,
            receiverId: req.user.id,
        },
    });
    if (!notification) {
        throw new ApiErrors_1.default(404, "Notification not found for the user");
    }
    yield prisma_1.default.notifications.update({
        where: { id: notificationId },
        data: { read: true },
    });
    return notification;
});
exports.notificationServices = {
    sendSingleNotification,
    sendNotifications,
    getNotificationsFromDB,
    getSingleNotificationFromDB,
    sendChannelNofitications,
};
