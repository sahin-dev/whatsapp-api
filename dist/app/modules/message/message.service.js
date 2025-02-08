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
const axios_1 = __importDefault(require("axios"));
const appID = config_1.default.agora.app_id;
const appCertificate = config_1.default.agora.app_certificate;
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
const searchMessageFromDB = (channelId, search) => __awaiter(void 0, void 0, void 0, function* () {
    if (search === undefined) {
        return [];
    }
    const existingChannel = yield prisma_1.default.chanel.findUnique({
        where: { id: channelId },
    });
    if (!existingChannel) {
        throw new ApiErrors_1.default(404, "Channel not found");
    }
    const messages = yield prisma_1.default.message.findMany({
        where: {
            channelId: channelId,
            message: {
                contains: search,
                mode: "insensitive",
            },
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
    return messages;
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
    // if (pinnedMessages.length === 0) {
    //   return null;
    // }
    return pinnedMessages;
});
// generate agora access token
const generateAccessTokenInAgora = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const channelName = payload.roomId;
    const uid = payload.uid;
    const expiredTimeInSeconds = 3600; // 1 hour
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expiredTimeInSeconds;
    const role = payload.role;
    // console.log(role)
    // console.log(role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER);
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role === "publisher" ? agora_access_token_1.RtcRole.PUBLISHER : agora_access_token_1.RtcRole.SUBSCRIBER, privilegeExpireTime);
    return token;
});
const getResourceId = (roomId, uid) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const url = `https://api.agora.io/v1/apps/${appID}/cloud_recording/acquire`;
    const payload = {
        cname: roomId,
        uid: uid.toString(),
        clientRequest: {},
    };
    try {
        const response = yield axios_1.default.post(url, payload, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${appID}:${appCertificate}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
        });
        console.log("Response:", response.data);
        return response.data.resourceId;
    }
    catch (error) {
        console.error("Error fetching Resource ID:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error("Failed to fetch Resource ID");
    }
});
// const generateToken = (roomId: string, uid: number) => {
//   const expirationTimeInSeconds = 3600; // 1 hour
//   const currentTimestamp = Math.floor(Date.now() / 1000);
//   const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
//   const token = RtcTokenBuilder.buildTokenWithUid(
//     appID,
//     appCertificate,
//     roomId,
//     uid,
//     RtcRole.PUBLISHER,
//     privilegeExpiredTs
//   );
//   return token;
// };
const startRecordingInAgora = (roomId, uid) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const resourceId = yield getResourceId(roomId, uid);
    console.log(resourceId);
    // const token = generateToken(roomId, uid);
    const url = `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;
    const payload = {
        cname: roomId,
        uid: uid.toString(),
        clientRequest: {
            recordingConfig: {
                maxIdleTime: 30,
                streamTypes: 2,
                channelType: 1,
                videoStreamType: 1,
                transcodingConfig: {
                    height: 1080,
                    width: 1920,
                    bitrate: 2260,
                    fps: 15,
                    mixedVideoLayout: 1,
                    backgroundColor: "#000000",
                },
            },
        },
    };
    try {
        const response = yield axios_1.default.post(url, payload, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${appID}:${appCertificate}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        console.error("Error starting recording:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error("Failed to start recording");
    }
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
    searchMessageFromDB,
    startRecordingInAgora,
};
