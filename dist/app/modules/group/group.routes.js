"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const group_controller_1 = require("./group.controller");
const parseBodyData_1 = require("../../middlewares/parseBodyData");
const fileUploader_1 = require("../../../helpers/fileUploader");
const router = (0, express_1.Router)();
//tested
router.post("/create", fileUploader_1.fileUploader.uploadGroupImage, (0, auth_1.default)(), parseBodyData_1.parseBodyData, group_controller_1.groupControllers.createGroup);
//tested
router.get("/", (0, auth_1.default)(), group_controller_1.groupControllers.getAllGroups);
//tested
router.get("/:groupId", (0, auth_1.default)(), group_controller_1.groupControllers.getSingleGroup);
//tested
router.put("/:groupId", fileUploader_1.fileUploader.uploadGroupImage, (0, auth_1.default)(), parseBodyData_1.parseBodyData, group_controller_1.groupControllers.updateGroup);
//tested
router.delete("/:groupId", (0, auth_1.default)(), group_controller_1.groupControllers.deleteGroup);
//tested
router.get("/access/groups", (0, auth_1.default)(), group_controller_1.groupControllers.accessGroups);
//mute notification
//new routes
router.get('/my-groups', (0, auth_1.default)(), group_controller_1.groupControllers.getMyGroups);
router.post("/add/:memberId/:groupId", (0, auth_1.default)(), group_controller_1.groupControllers.addMember);
router.get("/users/:groupId", (0, auth_1.default)(), group_controller_1.groupControllers.getAllGroupMembers);
router.post("/exit/:groupId", (0, auth_1.default)(), group_controller_1.groupControllers.exitGroup);
router.post("toggle-notification/:groupId", (0, auth_1.default)());
exports.groupRoutes = router;
