import express from "express";
import auth from "../../middlewares/auth";
import { messageController } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";

const router = express.Router();

//new routes for new requirements

router.post("send/:groupId",fileUploader.sendFiles, auth(), messageController.sendMessage)


router.get("/get-last-message/:channelId", auth(), )







//old routes with channel

router.post(
  "/send-message/:channelId",
  fileUploader.sendFiles,
  parseBodyData,
  auth(),
  messageController.createMessage
);


router.get("/:messageId", auth(), messageController.getSingleMessage);

router.delete(
  "/delete-message/:messageId",
  auth(),
  messageController.deleteSingleMessage
);
router.delete(
  "/delete/messages/:channelId",
  auth(),
  messageController.deleteAllMessages
);
router.patch(
  "/update/message/:messageId",
  auth(),
  messageController.updateMessage
);

router.delete(
  "/delete/multiple-messages",
  auth(),
  messageController.deleteMultipleMessages
);

router.post(
  "/generate-access-token",
  auth(),
  messageController.generateAccessToken
);

router.post(
  "/start/recording/:channelId",
  auth(),
  messageController.startRecording
);

router.get(
  "/pinned-message/:channelId",
  auth(),
  messageController.pinnedMessage
);

router.get(
  "/search/messages/:channelId",
  auth(),
  messageController.searchMessages
);
router.post(
  "/pin-unpinned-message/:messageId",
  auth(),
  messageController.pinUnpinMessage
);

export const messageRoute = router;
