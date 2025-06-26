import express from "express";
import auth from "../../middlewares/auth";
import { messageController } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";

const router = express.Router();

//new routes for new requirements

router.post("send/:groupId", auth(), messageController.sendMessage)


router.get("/get-last-message/:channelId", auth(), )







//old routes with channel

router.post(
  "/send/:groupId",
  fileUploader.sendFile,
  parseBodyData,
  auth(),
  messageController.createMessage
);


router.get("/:messageId", auth(), messageController.getSingleMessage);

router.delete(
  "/:messageId",
  auth(),
  messageController.deleteSingleMessage
);
router.delete(
  "/group/:groupId",
  auth(),
  messageController.deleteAllMessages
);
router.patch(
  "/:messageId",
  auth(),
  messageController.updateMessage
);

router.delete(
  "/multiple-messages",
  auth(),
  messageController.deleteMultipleMessages
);

router.post(
  "/generate-access-token",
  auth(),
  messageController.generateAccessToken
);
router.post("/start/call/:groupId", auth(),messageController.startCall )
router.post("/call/end/:callId", auth(), messageController.endCall)
router.get("/call/history/:groupId", auth(), messageController.getCallHistory)

router.post(
  "/start/recording/:groupId",
  auth(),
  messageController.startRecording
);

router.get(
  "/pinned/:groupId",
  auth(),
  messageController.pinnedMessage
);

router.get(
  "/search/messages/:groupId",
  auth(),
  messageController.searchMessages
);
router.post(
  "/toggole-pin/:messageId",
  auth(),
  messageController.pinUnpinMessage
);

export const messageRoute = router;
