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
exports.groupServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const config_1 = __importDefault(require("../../../config"));
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const createGroupInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const userId = req.user.id;
    const file = req.file;
    // if (!file) {
    //   throw new ApiError(400, "No file attached");
    // }
    const imageUrl = file
        ? `${config_1.default.backend_base_url}/uploads/${file.originalname}`
        : null;
    const existingGroup = yield prisma_1.default.group.findFirst({
        where: { groupName: payload.groupName },
    });
    if (existingGroup) {
        throw new ApiErrors_1.default(409, "Group with the same name already exists");
    }
    const newGroup = yield prisma_1.default.group.create({
        data: Object.assign(Object.assign({}, payload), { userId: userId, groupImage: imageUrl ? imageUrl : "" }),
    });
    yield prisma_1.default.groupUser.create({
        data: {
            userId: userId,
            groupId: newGroup.id
        }
    });
    return newGroup;
});
const getGroupsInDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield prisma_1.default.group.findMany({
        include: { channel: true },
        orderBy: { createdAt: "desc" },
    });
    if (groups.length === 0) {
        throw new ApiErrors_1.default(404, "Group not found");
    }
    return groups;
});
const getGroupInDB = (groupId) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield prisma_1.default.group.findUnique({
        where: { id: groupId },
        include: { channel: true },
    });
    if (!group) {
        throw new ApiErrors_1.default(404, "Group not found");
    }
    return group;
});
const updateGroupInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const groupId = req.params.groupId;
    const file = req.file;
    const imageUrl = file
        ? `${config_1.default.backend_base_url}/uploads/${file.originalname}`
        : null;
    const existingGroup = yield prisma_1.default.group.findUnique({
        where: { id: groupId },
    });
    if (!existingGroup) {
        throw new ApiErrors_1.default(404, "Group not found for update");
    }
    const updatedGroup = yield prisma_1.default.group.update({
        where: { id: groupId },
        data: Object.assign(Object.assign({}, payload), { groupImage: imageUrl ? imageUrl : existingGroup.groupImage }),
    });
    return updatedGroup;
});
const deleteGroupInDB = (groupId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingGroup = yield prisma_1.default.group.findUnique({
        where: { id: groupId },
    });
    if (!existingGroup) {
        throw new ApiErrors_1.default(404, "Group not found for delete");
    }
    yield prisma_1.default.group.delete({ where: { id: groupId } });
    return;
});
const accessGroupInDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    const allGroups = yield prisma_1.default.group.findMany({
        include: {
            channel: true,
        },
        orderBy: { createdAt: "desc" },
    });
    if ((user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.USER) {
        const mySubscriptions = yield prisma_1.default.subscription.findMany({
            where: { userId: userId },
        });
        const accessibleGroups = allGroups.filter((group) => mySubscriptions.some((sub) => sub.group === group.groupName));
        return accessibleGroups;
    }
    else {
        return allGroups;
    }
});
//new services
const getMyGroups = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const myGroups = yield prisma_1.default.groupUser.findMany({ where: { userId } });
    const groupIds = myGroups.map(group => group.id);
    if (groupIds.length <= 0) {
        return { message: "No Group" };
    }
    return groupIds;
});
const addMember = (memberId, groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield prisma_1.default.group.findUnique({ where: { id: groupId } });
    if ((group === null || group === void 0 ? void 0 : group.adminId) !== userId) {
        throw new ApiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'You are not allowed to add member to this group');
    }
    yield prisma_1.default.groupUser.create({ data: { groupId, userId: memberId } });
    return { message: "User added to the group" };
});
//get all members of a specific group
const getAllGroupMembers = (groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield prisma_1.default.group.findUnique({ where: { id: groupId } });
    const groupUsers = yield prisma_1.default.groupUser.findMany({ where: { groupId }, include: { user: true } });
    const targetMember = groupUsers.find((groupUser) => groupUser.id === userId);
    if ((group === null || group === void 0 ? void 0 : group.adminId) !== userId || !targetMember) {
        throw new ApiErrors_1.default(http_status_1.default.UNAUTHORIZED, "Sorry, you are not allowed to see the members.");
    }
    let mappedUsers = groupUsers.map(groupUser => {
        return { name: groupUser.user.name, image: groupUser.user.avatar, phone: groupUser.user.phone, admin: groupUser.isAdmin };
    });
    return mappedUsers;
});
//exit from the group by the user him/herself
const exitGroup = (groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const groupUser = yield prisma_1.default.groupUser.findFirst({ where: { groupId, userId } });
    if (!groupUser) {
        throw new ApiErrors_1.default(http_status_1.default.NOT_FOUND, "You are not member of this group");
    }
    yield prisma_1.default.groupUser.delete({ where: { id: groupUser.id } });
    return { message: "exited from the group" };
});
//make  a user admin by a group admin
const makeAdmin = (adminId, groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const groupUser = yield prisma_1.default.groupUser.findUnique({ where: { id: adminId } });
    if (!groupUser || !groupUser.isAdmin) {
        throw new ApiErrors_1.default(http_status_1.default.UNAUTHORIZED, 'You are authoized to make admin');
    }
    let adminUser = yield prisma_1.default.groupUser.update({ where: { id: userId }, data: { isAdmin: true } });
    return adminUser;
});
//remove a user by an admin
const removeUserFromGroup = (adminId, groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const groupUser = yield prisma_1.default.groupUser.findUnique({ where: { id: adminId } });
    if (!groupUser || !groupUser.isAdmin) {
        throw new ApiErrors_1.default(http_status_1.default.UNAUTHORIZED, "You are not authroized to leave user from group");
    }
    yield prisma_1.default.groupUser.delete({ where: { id: userId } });
    return { message: "User removed successfully" };
});
//toggole notificaiton
const toggoleNotification = (groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const groupUser = yield prisma_1.default.groupUser.findUnique({ where: { id: userId } });
    if (!groupUser) {
        throw new ApiErrors_1.default(http_status_1.default.NOT_FOUND, "Group User not found");
    }
    yield prisma_1.default.groupUser.update({ where: { id: userId }, data: { isMuted: !groupUser.isMuted } });
    return { message: "Notificaton toggoled successfully" };
});
///report a group by a user
const reportGroup = (groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
});
//search group user
const searchGroupUser = (groupId, q) => __awaiter(void 0, void 0, void 0, function* () {
    const groupUsers = yield prisma_1.default.groupUser.findMany({
        where: { groupId },
        include: {
            user: true
        }
    });
    // Filter users by name after fetching
    return groupUsers.filter(groupUser => { var _a; return groupUser.user && ((_a = groupUser.user.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q.toLowerCase())); });
});
//get group bio
const getGroupBio = (groupId) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield prisma_1.default.group.findUnique({ where: { id: groupId } });
    if (!group) {
        throw new ApiErrors_1.default(http_status_1.default.NOT_FOUND, "Group not found");
    }
    const groupBio = { descripton: group.about, createdAt: group.createdAt };
    return groupBio;
});
//edit group bio
const editGroupBio = (userId, groupId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const groupUser = yield prisma_1.default.groupUser.findFirst({ where: { groupId, userId } });
    if (!groupUser || !groupUser.isAdmin) {
        throw new ApiErrors_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized to edit bio");
    }
    const updatedGroup = yield prisma_1.default.group.update({ where: { id: groupId }, data: { about: payload.about } });
    return updateGroupInDB;
});
exports.groupServices = {
    createGroupInDB,
    getGroupsInDB,
    getGroupInDB,
    updateGroupInDB,
    deleteGroupInDB,
    accessGroupInDB,
    //new
    getMyGroups,
    addMember,
    getAllGroupMembers,
    exitGroup
};
