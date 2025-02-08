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
exports.notificationController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const notification_services_1 = require("./notification.services");
const sendNotification = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_services_1.notificationServices.sendSingleNotification(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "notification sent successfully",
        data: notification,
    });
}));
const sendNotifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = yield notification_services_1.notificationServices.sendNotifications(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "notifications sent successfully",
        data: notifications,
    });
}));
const getNotifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = yield notification_services_1.notificationServices.getNotificationsFromDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Notifications retrieved successfully",
        data: notifications,
    });
}));
const getSingleNotificationById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notificationId = req.params.notificationId;
    const notification = yield notification_services_1.notificationServices.getSingleNotificationFromDB(req, notificationId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Notification retrieved successfully",
        data: notification,
    });
}));
const sendChannelNotification = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const members = yield notification_services_1.notificationServices.sendChannelNofitications(req);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Channel members retrieved successfully",
        data: members,
    });
}));
exports.notificationController = {
    sendNotification,
    sendNotifications,
    getNotifications,
    getSingleNotificationById,
    sendChannelNotification,
};
