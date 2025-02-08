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
exports.authController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const auth_service_1 = require("./auth.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
//login user
const loginUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const result = yield auth_service_1.authService.loginUserIntoDB(req.body);
    // res.cookie("accessToken", result.accessToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "none",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User successfully logged in",
        data: result,
    });
}));
// get profile for logged in user
const getProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const user = yield auth_service_1.authService.getProfileFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User profile retrieved successfully",
        data: user,
    });
}));
// update user profile only logged in user
const updateProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const updatedUser = yield auth_service_1.authService.updateProfileIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User profile updated successfully",
        data: updatedUser,
    });
}));
const loginWithAuth = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.authService.loginAuthProvider(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User successfully logged in",
        data: result,
    });
}));
const adminLogin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.authService.adminLoginAuth(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Admin successfully logged in",
        data: result,
    });
}));
const updateProfileImage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const avatar = yield auth_service_1.authService.updateProfileImageInDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Profile image updated successfully",
        data: avatar,
    });
}));
exports.authController = {
    loginUser,
    getProfile,
    updateProfile,
    loginWithAuth,
    adminLogin,
    updateProfileImage,
};
