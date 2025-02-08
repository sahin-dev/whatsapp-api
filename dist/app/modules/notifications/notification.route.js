"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRoute = void 0;
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("./notification.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.post("/send-notification/:userId", (0, auth_1.default)(), notification_controller_1.notificationController.sendNotification);
router.post("/send-notification", (0, auth_1.default)(), notification_controller_1.notificationController.sendNotifications);
router.get("/", (0, auth_1.default)(), notification_controller_1.notificationController.getNotifications);
router.get("/:notificationId", (0, auth_1.default)(), notification_controller_1.notificationController.getSingleNotificationById);
router.post("/send-channel-notification/:channelId", (0, auth_1.default)(), notification_controller_1.notificationController.sendChannelNotification);
exports.notificationsRoute = router;
