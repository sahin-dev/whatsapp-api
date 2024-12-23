import express from "express";
import { notificationController } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/send-notification/:userId",
  auth(),
  notificationController.sendNotification
);

router.post(
  "/send-notification",
  auth(),
  notificationController.sendNotifications
);

router.get("/", auth(), notificationController.getNotifications);
router.get(
  "/:notificationId",
  auth(),
  notificationController.getSingleNotificationById
);
router.post(
  "/send-channel-notification/:channelId",
  auth(),
  notificationController.sendChannelNotification
);

export const notificationsRoute = router;
