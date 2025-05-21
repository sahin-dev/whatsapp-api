"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRoute = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const message_controller_1 = require("./message.controller");
const fileUploader_1 = require("../../../helpers/fileUploader");
const parseBodyData_1 = require("../../middlewares/parseBodyData");
const router = express_1.default.Router();
//new routes for new requirements
router.post("send/:groupId", fileUploader_1.fileUploader.sendFiles, (0, auth_1.default)(), message_controller_1.messageController.sendMessage);
router.get("/get-last-message/:channelId", (0, auth_1.default)());
//old routes with channel
router.post("/send-message/:channelId", fileUploader_1.fileUploader.sendFiles, parseBodyData_1.parseBodyData, (0, auth_1.default)(), message_controller_1.messageController.createMessage);
router.get("/:messageId", (0, auth_1.default)(), message_controller_1.messageController.getSingleMessage);
router.delete("/delete-message/:messageId", (0, auth_1.default)(), message_controller_1.messageController.deleteSingleMessage);
router.delete("/delete/messages/:channelId", (0, auth_1.default)(), message_controller_1.messageController.deleteAllMessages);
router.patch("/update/message/:messageId", (0, auth_1.default)(), message_controller_1.messageController.updateMessage);
router.delete("/delete/multiple-messages", (0, auth_1.default)(), message_controller_1.messageController.deleteMultipleMessages);
router.post("/generate-access-token", (0, auth_1.default)(), message_controller_1.messageController.generateAccessToken);
router.post("/start/recording/:channelId", (0, auth_1.default)(), message_controller_1.messageController.startRecording);
router.get("/pinned-message/:channelId", (0, auth_1.default)(), message_controller_1.messageController.pinnedMessage);
router.get("/search/messages/:channelId", (0, auth_1.default)(), message_controller_1.messageController.searchMessages);
router.post("/pin-unpinned-message/:messageId", (0, auth_1.default)(), message_controller_1.messageController.pinUnpinMessage);
exports.messageRoute = router;
