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
exports.groupControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const group_service_1 = require("./group.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
// create a new group
const createGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield group_service_1.groupServices.createGroupInDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "New group created successfully",
        data: result,
    });
}));
// get all groups
const getAllGroups = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield group_service_1.groupServices.getGroupsInDB();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Groups retrieved",
        data: groups,
    });
}));
// get single group
const getSingleGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield group_service_1.groupServices.getGroupInDB(req.params.groupId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Group retrived successfully",
        data: group,
    });
}));
// update group
const updateGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedGroup = yield group_service_1.groupServices.updateGroupInDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Group updated successfully",
        data: updatedGroup,
    });
}));
// delete group
const deleteGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const groupId = req.params.groupId;
    yield group_service_1.groupServices.deleteGroupInDB(groupId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Group deleted successfully",
    });
}));
// get access group
const accessGroups = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req);
    const user = req.user;
    console.log(user.id);
    const userId = user.id;
    const accessGroups = yield group_service_1.groupServices.accessGroupInDB(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Access groups retrieved successfully",
        data: accessGroups,
    });
}));
exports.groupControllers = {
    createGroup,
    getAllGroups,
    getSingleGroup,
    updateGroup,
    deleteGroup,
    accessGroups,
};
