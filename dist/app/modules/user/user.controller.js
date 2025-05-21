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
exports.UserControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const user_services_1 = require("./user.services");
//get users
const getUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_services_1.userService.getUsersIntoDB(req);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "users retrived successfully",
        data: users,
    });
}));
//get single user
const getSingleUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_services_1.userService.getSingleUserIntoDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "user retrived successfully",
        data: user,
    });
}));
//update user
const updateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const updatedUser = yield user_services_1.userService.updateUserIntoDB(user.id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "user updated successfully",
        data: updatedUser,
    });
}));
//delete user
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const userId = req.params.id;
    const userId = req.user.id;
    yield user_services_1.userService.deleteUserIntoDB(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "user deleted successfully",
    });
}));
exports.UserControllers = {
    getUsers,
    getSingleUser,
    updateUser,
    deleteUser,
};
