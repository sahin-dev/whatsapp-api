"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chanelRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const parseBodyData_1 = require("../../middlewares/parseBodyData");
const fileUploader_1 = require("../../../helpers/fileUploader");
const chanel_controller_1 = require("./chanel.controller");
const router = (0, express_1.Router)();
//tested
router.post("/create/:groupId", fileUploader_1.fileUploader.uploadChanelImage, parseBodyData_1.parseBodyData, (0, auth_1.default)(), chanel_controller_1.chanelControllers.createChanel);
//tested
router.get("/", (0, auth_1.default)(), chanel_controller_1.chanelControllers.getAllChanels);
//tested
router.get("/access-channels/:groupId", (0, auth_1.default)(), chanel_controller_1.chanelControllers.getAccessChannels);
//tested
router.get("/:chanelId", (0, auth_1.default)(), chanel_controller_1.chanelControllers.getSingleChanel);
router.put("/:chanelId", fileUploader_1.fileUploader.uploadChanelImage, parseBodyData_1.parseBodyData, (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN), chanel_controller_1.chanelControllers.updateChanel);
router.delete("/:chanelId", (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN), chanel_controller_1.chanelControllers.deleteChanel);
router.post("/add-member/:channelId", (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), chanel_controller_1.chanelControllers.addMember);
router.post("/remove-member/:channelId", (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), chanel_controller_1.chanelControllers.removeMember);
router.get("/:channelId/members", (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), chanel_controller_1.chanelControllers.getAllMembersInchannel);
router.get("/:channelId/files", (0, auth_1.default)(), chanel_controller_1.chanelControllers.channelFiles);
router.get("/recordings/:channelId", (0, auth_1.default)(), chanel_controller_1.chanelControllers.recordingFiles);
router.get("/recordings/:channelId/:channelUid", (0, auth_1.default)(), chanel_controller_1.chanelControllers.singleRecordingFile);
exports.chanelRoutes = router;
