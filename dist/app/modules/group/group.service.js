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
const createGroupInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const userId = req.user.id;
    const file = req.file;
    if (!file) {
        throw new ApiErrors_1.default(400, "No file attached");
    }
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
    return newGroup;
});
const getGroupsInDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield prisma_1.default.group.findMany({
        include: { chanel: true },
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
        include: { chanel: true },
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
    const allGroups = yield prisma_1.default.group.findMany({ include: { chanel: true } });
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
exports.groupServices = {
    createGroupInDB,
    getGroupsInDB,
    getGroupInDB,
    updateGroupInDB,
    deleteGroupInDB,
    accessGroupInDB,
};
