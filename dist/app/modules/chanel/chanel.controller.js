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
exports.chanelControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const chanel_service_1 = require("./chanel.service");
// create a new chanel
const createChanel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield chanel_service_1.chanelServices.createChanelInDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "New Chanel created successfully",
        data: result,
    });
}));
// get all chanel
const getAllChanels = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chanels = yield chanel_service_1.chanelServices.getChanelsInDB();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Chanels retrieved",
        data: chanels,
    });
}));
// get all channels for access user
const getAccessChannels = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    const channels = yield chanel_service_1.chanelServices.getAccessChannelsFromDB(userId, groupId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "channels retrieved successfully",
        data: channels,
    });
}));
// get single chanel
const getSingleChanel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chanel = yield chanel_service_1.chanelServices.getChanelInDB(req.params.chanelId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Chanel retrived successfully",
        data: chanel,
    });
}));
// update chanel
const updateChanel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedChanel = yield chanel_service_1.chanelServices.updateChanelInDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Chanel updated successfully",
        data: updatedChanel,
    });
}));
// delete chanel
const deleteChanel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chanelId = req.params.chanelId;
    yield chanel_service_1.chanelServices.deleteChanelInDB(chanelId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Chanel deleted successfully",
    });
}));
// add members  in channel
const addMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = req.params.channelId;
    const userId = req.body.userId;
    const result = yield chanel_service_1.chanelServices.addMemberInChannel(channelId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "member added successfully",
        data: result,
    });
}));
// get all members for a channel
const getAllMembersInchannel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = req.params.channelId;
    const members = yield chanel_service_1.chanelServices.getMembersByChannelId(channelId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "members retrieved successfully",
        data: members,
    });
}));
// remove member from channel
const removeMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = req.params.channelId;
    const userId = req.body.userId;
    const result = yield chanel_service_1.chanelServices.removeMemberFromChannel(channelId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "remove member successfully",
        data: result,
    });
}));
// get all files from channel
const channelFiles = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = req.params.channelId;
    const files = yield chanel_service_1.chanelServices.channelFilesFromDB(channelId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "files retrived successfully",
        data: files,
    });
}));
exports.chanelControllers = {
    createChanel,
    getAllChanels,
    getSingleChanel,
    updateChanel,
    deleteChanel,
    getAccessChannels,
    addMember,
    removeMember,
    getAllMembersInchannel,
    channelFiles,
};
