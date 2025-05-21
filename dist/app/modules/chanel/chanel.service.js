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
exports.chanelServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const config_1 = __importDefault(require("../../../config"));
const createChanelInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const userId = req.user.id;
    const groupId = req.params.groupId;
    const file = req.file;
    if (!file) {
        throw new ApiErrors_1.default(400, "No file attached");
    }
    const imageUrl = file
        ? `${config_1.default.backend_base_url}/uploads/${file.originalname}`
        : null;
    const existingGroup = yield prisma_1.default.channel.findFirst({
        where: { channelName: payload.channelName },
    });
    if (existingGroup) {
        throw new ApiErrors_1.default(409, "chanel with the same name already exists");
    }
    const newGroup = yield prisma_1.default.channel.create({
        data: Object.assign(Object.assign({}, payload), { userId,
            groupId, channelImage: imageUrl ? imageUrl : "", memberIds: [userId] }),
    });
    return newGroup;
});
const getChanelsInDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const chanels = yield prisma_1.default.channel.findMany({
        include: { group: true },
        orderBy: { createdAt: "desc" },
    });
    if (chanels.length === 0) {
        throw new ApiErrors_1.default(404, "chanels not found ");
    }
    return chanels;
});
const getAccessChannelsFromDB = (userId, groupId) => __awaiter(void 0, void 0, void 0, function* () {
    const chanels = yield prisma_1.default.channel.findMany({
        include: {
            group: true,
            messages: {
                select: { createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        orderBy: { createdAt: "desc" },
        where: {
            groupId: groupId,
            memberIds: {
                has: userId,
            },
        },
    });
    if (chanels.length === 0) {
        throw new ApiErrors_1.default(404, "chanels not found");
    }
    return chanels;
});
const getChanelInDB = (chanelId) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield prisma_1.default.channel.findUnique({
        where: { id: chanelId },
        include: { group: true },
    });
    if (!group) {
        throw new ApiErrors_1.default(404, "chanel not found");
    }
    return group;
});
const updateChanelInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const chanelId = req.params.chanelId;
    const file = req.file;
    const imageUrl = file
        ? `${config_1.default.backend_base_url}/uploads/${file.originalname}`
        : null;
    const existingChanel = yield prisma_1.default.channel.findUnique({
        where: { id: chanelId },
    });
    if (!existingChanel) {
        throw new ApiErrors_1.default(404, "chanel not found for update");
    }
    const updatedChanel = yield prisma_1.default.channel.update({
        where: { id: chanelId },
        data: Object.assign(Object.assign({}, payload), { chanelImage: imageUrl ? imageUrl : existingChanel.channelImage }),
    });
    return updatedChanel;
});
const deleteChanelInDB = (chanelId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingChanel = yield prisma_1.default.channel.findUnique({
        where: { id: chanelId },
    });
    if (!existingChanel) {
        throw new ApiErrors_1.default(404, "Group not found for delete");
    }
    yield prisma_1.default.channel.delete({ where: { id: chanelId } });
    return;
});
const addMemberInChannel = (channelId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const isExisting = yield prisma_1.default.channel.findUnique({
        where: {
            id: channelId,
            memberIds: {
                has: userId,
            },
        },
    });
    if (isExisting) {
        throw new ApiErrors_1.default(409, "this user already exists");
    }
    const result = yield prisma_1.default.channel.update({
        where: { id: channelId },
        data: {
            memberIds: {
                push: userId,
            },
        },
    });
    return result;
});
const getMembersByChannelId = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the channel and retrieve its memberIds
    const channel = yield prisma_1.default.channel.findUnique({
        where: { id: channelId },
        select: { memberIds: true }, // Only select the member IDs
    });
    if (!channel) {
        throw new ApiErrors_1.default(404, "Channel not found");
    }
    // Fetch all member information using the retrieved memberIds
    const members = yield prisma_1.default.user.findMany({
        where: {
            id: { in: channel.memberIds }, // Use `in` to filter by multiple IDs
        },
    });
    return members;
});
const removeMemberFromChannel = (channelId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const isExisting = yield prisma_1.default.channel.findFirst({
        where: {
            id: channelId,
            memberIds: {
                has: userId,
            },
        },
    });
    if (!isExisting) {
        throw new ApiErrors_1.default(409, "user not existing");
    }
    const result = yield prisma_1.default.channel.update({
        where: { id: channelId },
        data: {
            memberIds: {
                set: isExisting.memberIds.filter((id) => id !== userId),
            },
        },
    });
    return result;
});
const channelFilesFromDB = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.message.findMany({
        where: { channelId: channelId },
    });
    if (result.length === 0) {
        throw new ApiErrors_1.default(404, "No files found in this channel");
    }
    const allFiles = result.flatMap((message) => message.files);
    return allFiles;
});
const recordingFilesFromDB = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.recording.findMany({
        where: { channelId: channelId },
        orderBy: { createdAt: "desc" },
        select: {
            recordingLink: true,
            createdAt: true,
        },
    });
    return result;
});
const getRecordinLinkFromDB = (channelId, channelUid) => __awaiter(void 0, void 0, void 0, function* () {
    const recordingLink = yield prisma_1.default.recording.findFirst({
        where: { channelId, channelUid },
    });
    return recordingLink;
});
exports.chanelServices = {
    createChanelInDB,
    getChanelsInDB,
    getChanelInDB,
    updateChanelInDB,
    deleteChanelInDB,
    addMemberInChannel,
    removeMemberFromChannel,
    getAccessChannelsFromDB,
    getMembersByChannelId,
    channelFilesFromDB,
    recordingFilesFromDB,
    getRecordinLinkFromDB,
};
