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
exports.messageController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const message_service_1 = require("./message.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const server_1 = require("../../../server");
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const createMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chanelId } = req.params;
    yield message_service_1.messageService.createMessageInDB(req);
    // Send the single message only to clients connected to the specific channel
    // const result = await messageService.createMessageInDB(req);
    //send all the messages only to clients connected to the specific channel
    const results = yield prisma_1.default.message.findMany({
        where: { channelId: chanelId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                    email: true,
                    role: true,
                    status: true,
                },
            },
        },
    });
    const messagePayload = {
        type: "message",
        channelId: chanelId,
        message: results,
    };
    // Send the message only to clients connected to the specific channel
    const channelClient = server_1.channelClients.get(chanelId) || [];
    channelClient.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(messagePayload));
        }
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "Message created successfully",
        data: results,
    });
}));
const getSingleMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const message = yield message_service_1.messageService.getSingleMessageFromDB(messageId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "message retrived successfully",
        data: message,
    });
}));
const deleteSingleMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    yield message_service_1.messageService.deleteSingleMessageFromDB(messageId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "message deleted successfully",
    });
}));
const deleteAllMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channelId } = req.params;
    yield message_service_1.messageService.deleteAllMessagesFromChannel(channelId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "All messages deleted successfully from the channel",
    });
}));
const deleteMultipleMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body;
    yield message_service_1.messageService.deleteMultipleMessagesFromDB(ids);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Multiple Message deleted successfully",
    });
}));
const updateMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const result = yield message_service_1.messageService.updateSingleMessageInDB(messageId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Message updated successfully",
        data: result,
    });
}));
const generateAccessToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = yield message_service_1.messageService.generateAccessTokenInAgora(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Access token generate successfully",
        data: accessToken,
    });
}));
const startRecording = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channelId } = req.params;
    const uid = req.body.uid;
    const result = yield message_service_1.messageService.startRecordingInAgora(channelId, uid);
    (0, sendResponse_1.default)(res, { statusCode: 200, success: true, message: "Recording Start", data: result });
}));
const pinnedMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channelId } = req.params;
    const result = yield message_service_1.messageService.pinnedMessageInDB(channelId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Retrive pinned message successfully",
        data: result,
    });
}));
const searchMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const { channelId } = req.params;
    const results = yield message_service_1.messageService.searchMessageFromDB(channelId, search);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Search messages retrived successfully",
        data: results,
    });
}));
exports.messageController = {
    createMessage,
    getSingleMessage,
    deleteSingleMessage,
    deleteAllMessages,
    updateMessage,
    deleteMultipleMessages,
    generateAccessToken,
    pinnedMessage,
    searchMessages,
    startRecording,
};
