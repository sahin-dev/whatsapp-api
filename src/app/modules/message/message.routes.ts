import express from "express";
import auth from "../../middlewares/auth";
import { messageController } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.post(
  "/send-message/:chanelId",
  fileUploader.sendFiles,
  parseBodyData,
  auth(),
  messageController.createMessage
);
router.get("/:messageId", auth(), messageController.getSingleMessage);

export const messageRoute = router;
