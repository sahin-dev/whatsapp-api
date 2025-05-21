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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const client_1 = require("@prisma/client");
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const prisma = new client_1.PrismaClient();
const mongodb_1 = require("mongodb");
const searchFilter_1 = require("../../../shared/searchFilter");
//get single user
const getSingleUserIntoDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongodb_1.ObjectId.isValid(id)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    const user = yield prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new ApiErrors_1.default(404, "user not found!");
    }
    const sanitizedUser = __rest(user, []);
    return sanitizedUser;
});
//get all users
const getUsersIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const searchFilters = search ? (0, searchFilter_1.searchFilter)(search) : {};
    const users = yield prisma.user.findMany({
        where: searchFilters,
    });
    const sanitizedUsers = users.map((user) => {
        const { accessToken } = user, sanitizedUser = __rest(user, ["accessToken"]);
        return sanitizedUser;
    });
    return sanitizedUsers;
});
//update user
const updateUserIntoDB = (id, userData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongodb_1.ObjectId.isValid(id)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    const existingUser = yield getSingleUserIntoDB(id);
    if (!existingUser) {
        throw new ApiErrors_1.default(404, "user not found for edit user");
    }
    const updatedUser = yield prisma.user.update({
        where: { id },
        data: userData,
    });
    return updatedUser;
});
//delete user
const deleteUserIntoDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongodb_1.ObjectId.isValid(userId)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    // if (userId === loggedId) {
    //   throw new ApiError(403, "You can't delete your own account!");
    // }
    const existingUser = yield getSingleUserIntoDB(userId);
    if (!existingUser) {
        throw new ApiErrors_1.default(404, "user not found for delete this");
    }
    yield prisma.user.delete({
        where: { id: userId },
    });
    return;
});
exports.userService = {
    getUsersIntoDB,
    getSingleUserIntoDB,
    updateUserIntoDB,
    deleteUserIntoDB,
};
