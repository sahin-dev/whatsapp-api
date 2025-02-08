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
exports.messageService = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const config_1 = __importDefault(require("../../../config"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const agora_access_token_1 = require("agora-access-token");
//using for socket in controllers
const createMessageInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    const uploadFiles = (files === null || files === void 0 ? void 0 : files.sendFiles) || [];
    const payload = req.body;
    const senderId = req.user.id;
    const chanelId = req.params.chanelId;
    if ((payload === null || payload === void 0 ? void 0 : payload.message) === undefined && files === undefined) {
        throw new ApiErrors_1.default(400, "Message or file is required");
    }
    const imageUrls = uploadFiles === null || uploadFiles === void 0 ? void 0 : uploadFiles.map((e) => {
        const result = e
            ? `${config_1.default.backend_base_url}/uploads/${e.filename}`
            : null;
        return result;
    });
    const newMessage = yield prisma_1.default.message.create({
        data: Object.assign(Object.assign({}, payload), { senderId, channelId: chanelId, files: imageUrls }),
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
    return newMessage;
});
//using for socket
const getMessagesFromDB = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield prisma_1.default.message.findMany({
        where: {
            channelId: channelId,
        },
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
    return message;
});
//using for socket
const deleteSingleMessageFromDB = (messageId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield prisma_1.default.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new ApiErrors_1.default(404, "Message not found for delete");
    }
    yield prisma_1.default.message.delete({
        where: { id: messageId },
    });
    return;
});
const getSingleMessageFromDB = (messageId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield prisma_1.default.message.findUnique({
        where: { id: messageId },
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
    return message;
});
const deleteAllMessagesFromChannel = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield prisma_1.default.message.findMany({
        where: { channelId: channelId },
    });
    if (messages.length === 0) {
        throw new ApiErrors_1.default(404, "No messages found in this channel");
    }
    yield prisma_1.default.message.deleteMany({ where: { channelId: channelId } });
    return;
});
//using for socket
const deleteMultipleMessagesFromDB = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.message.deleteMany({ where: { id: { in: ids } } });
    return;
});
const updateSingleMessageInDB = (messageId, updateText) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield prisma_1.default.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new ApiErrors_1.default(404, "Message not found for update");
    }
    const updatedMessage = yield prisma_1.default.message.update({
        where: { id: messageId },
        data: {
            message: updateText,
        },
    });
    return updatedMessage;
});
//using for socket
const pinUnpinMessage = (messageId, isPinned) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield prisma_1.default.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new ApiErrors_1.default(404, "Message not found for pin/unpin");
    }
    const result = yield prisma_1.default.message.update({
        where: { id: messageId },
        data: { isPinned },
    });
    return result;
});
const pinnedMessageInDB = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    const pinnedMessages = yield prisma_1.default.message.findMany({
        where: { isPinned: true, channelId: channelId },
        orderBy: { updatedAt: "desc" },
    });
    if (pinnedMessages.length === 0) {
        return null;
    }
    return pinnedMessages[0];
});
// generate agora access token
const generateAccessTokenInAgora = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const appID = config_1.default.agora.app_id;
    const appCertificate = config_1.default.agora.app_certificate;
    const channelName = payload.roomId;
    const uid = payload.uid;
    const expiredTimeInSeconds = 3600; // 1 hour
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expiredTimeInSeconds;
    const role = payload.role;
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role === "publisher" ? agora_access_token_1.RtcRole.PUBLISHER : agora_access_token_1.RtcRole.SUBSCRIBER, privilegeExpireTime);
    return token;
});
exports.messageService = {
    createMessageInDB,
    getMessagesFromDB,
    getSingleMessageFromDB,
    deleteSingleMessageFromDB,
    deleteAllMessagesFromChannel,
    updateSingleMessageInDB,
    deleteMultipleMessagesFromDB,
    pinUnpinMessage,
    generateAccessTokenInAgora,
    pinnedMessageInDB,
};
