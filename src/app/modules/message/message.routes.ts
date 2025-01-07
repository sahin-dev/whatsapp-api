import express from "express";
import auth from "../../middlewares/auth";
import { messageController } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/send-message/:chanelId",
  fileUploader.sendFiles,
  parseBodyData,
  auth(),
  messageController.createMessage
);
router.get("/:messageId", auth(), messageController.getSingleMessage);
router.delete(
  "/delete-message/:messageId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  messageController.deleteSingleMessage
);
router.delete(
  "/delete/messages/:channelId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  messageController.deleteAllMessages
);
router.patch(
  "/update/message/:messageId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  messageController.updateMessage
);

router.delete(
  "/delete/multiple-messages",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  messageController.deleteMultipleMessages
);

export const messageRoute = router;
