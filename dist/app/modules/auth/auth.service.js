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
exports.authService = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_1 = __importDefault(require("http-status"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
const loginUserIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let accessToken;
    let userInfo;
    const user = yield prisma_1.default.user.findUnique({
        where: {
            phone: payload.phone,
        },
    });
    if (!user) {
        const createUser = yield prisma_1.default.user.create({
            data: {
                phone: payload.phone
            },
        });
        accessToken = jwtHelpers_1.jwtHelpers.generateToken({
            id: createUser.id,
            phone: createUser.phone,
            fcmToken: createUser === null || createUser === void 0 ? void 0 : createUser.fcmToken,
            subscription: createUser === null || createUser === void 0 ? void 0 : createUser.subcription,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
        const { status, createdAt, updatedAt } = createUser, others = __rest(createUser, ["status", "createdAt", "updatedAt"]);
        userInfo = others;
    }
    else {
        accessToken = jwtHelpers_1.jwtHelpers.generateToken({
            id: user === null || user === void 0 ? void 0 : user.id,
            phone: user === null || user === void 0 ? void 0 : user.phone,
            fcmToken: payload.fcmToken,
            subscription: user === null || user === void 0 ? void 0 : user.subcription,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
        const updateUserInfo = yield prisma_1.default.user.update({
            where: {
                phone: payload.phone,
            },
            data: {
                fcmToken: payload.fcmToken,
                accessToken: accessToken,
            },
        });
        const { status, createdAt, updatedAt, accessToken: token } = updateUserInfo, others = __rest(updateUserInfo, ["status", "createdAt", "updatedAt", "accessToken"]);
        userInfo = others;
    }
    return {
        accessToken,
        userInfo,
    };
});
const logoutUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiErrors_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    yield prisma_1.default.user.update({ where: { id: userId }, data: { accessToken: null } });
    return { message: "User logged out successfully" };
});
// get profile for logged in user
const getProfileFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongodb_1.ObjectId.isValid(userId)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        include: { groupUser: true },
    });
    if (!user) {
        throw new ApiErrors_1.default(404, "user not found!");
    }
    const { createdAt, updatedAt } = user, sanitizedUser = __rest(user, ["createdAt", "updatedAt"]);
    return sanitizedUser;
});
// update user profile only logged in user
const updateProfileIntoDB = (userId, userData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongodb_1.ObjectId.isValid(userId)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiErrors_1.default(404, "user not found for edit user");
    }
    //check email uniquesness
    if (userData.email) {
        const existingUser = yield prisma_1.default.user.findFirst({ where: { email: userData.email } });
        if (existingUser) {
            throw new ApiErrors_1.default(http_status_1.default.CONFLICT, "User already exist with this email", userData.email);
        }
    }
    const updatedUser = yield prisma_1.default.user.update({
        where: { id: userId },
        data: {
            name: userData.username || user.name,
            email: userData.email || user.email
        },
    });
    const sanitizedUser = __rest(updatedUser, []);
    return sanitizedUser;
});
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded;
    }
    catch (error) {
        console.error("❌ Token Verification Failed:", error.message);
        throw error;
    }
};
// Step 3: Fetch User Profile
const fetchUserProfile = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(`${process.env.AUTH0_DOMAIN}/userinfo`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.data) {
        throw new ApiErrors_1.default(404, "User not found");
    }
    return response.data;
});
const loginAuthProvider = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield prisma_1.default.user.findFirst({
        where: { name: payload.username },
        include: { subscription: true },
    });
    if (!existingUser) {
        throw new ApiErrors_1.default(404, "User not found");
    }
    if (existingUser.role !== "USER") {
        const accessToken = jwtHelpers_1.jwtHelpers.generateToken({
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            fcmToken: existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
            subscription: existingUser.subcription,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
        const updatedUser = yield prisma_1.default.user.update({
            where: { phone: existingUser.phone },
            data: {
                fcmToken: payload.fcmToken ? payload.fcmToken : existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
                accessToken: accessToken,
            },
        });
        const userInfo = __rest(updatedUser, []);
        return {
            accessToken,
            userInfo,
        };
    }
    const response = yield axios_1.default.post(`${process.env.AUTH0_DOMAIN}/oauth/token`, {
        grant_type: "password",
        username: payload.username,
        password: payload.password,
        audience: process.env.AUTH0_AUDIENCE,
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        connection: "Username-Password-Authentication",
        scope: "openid profile email",
    }, {
        headers: {
            "Content-Type": "application/json",
        },
    });
    const token = response.data.access_token;
    verifyToken(token);
    const user = yield fetchUserProfile(token);
    if (existingUser.subscription.length === 0) {
        throw new ApiErrors_1.default(401, "need subscripion to min a plan");
    }
    const accessToken = jwtHelpers_1.jwtHelpers.generateToken({
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        fcmToken: existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
        subscription: existingUser.subcription,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
    const updatedUser = yield prisma_1.default.user.update({
        where: { phone: user.phone },
        data: {
            fcmToken: payload.fcmToken ? payload.fcmToken : existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
            accessToken: accessToken,
        },
    });
    const userInfo = __rest(updatedUser, []);
    return {
        accessToken,
        userInfo,
    };
});
const adminLoginAuth = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // const response = await axios.post(
    //   `${process.env.AUTH0_DOMAIN}/oauth/token`,
    //   {
    //     grant_type: "password",
    //     username: payload.username,
    //     password: payload.password,
    //     audience: process.env.AUTH0_AUDIENCE,
    //     client_id: process.env.AUTH0_CLIENT_ID,
    //     client_secret: process.env.AUTH0_CLIENT_SECRET,
    //     connection: "Username-Password-Authentication",
    //     scope: "openid profile email",
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );
    // const token = response.data.access_token;
    // verifyToken(token);
    // const user = await fetchUserProfile(token);
    const existingUser = yield prisma_1.default.user.findFirst({
        where: { name: payload.username },
    });
    if (!existingUser) {
        throw new ApiErrors_1.default(404, "Admin user not found");
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(payload.password, existingUser.email);
    if (!isPasswordValid) {
        throw new ApiErrors_1.default(401, "Invalid credentials");
    }
    if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.role) !== "ADMIN" && (existingUser === null || existingUser === void 0 ? void 0 : existingUser.role) !== "SUPER_ADMIN") {
        throw new ApiErrors_1.default(401, "You are not allowed to access this");
    }
    const authToken = jwtHelpers_1.jwtHelpers.generateToken({
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        fcmToken: existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
        subscription: existingUser.subcription,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
    const updatedUser = yield prisma_1.default.user.update({
        where: { phone: existingUser.phone },
        data: {
            accessToken: authToken,
        },
    });
    const { accessToken } = updatedUser, userInfo = __rest(updatedUser, ["accessToken"]);
    return {
        accessToken: authToken,
        userInfo,
    };
});
const updateProfileImageInDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const file = req.file;
    if (!mongodb_1.ObjectId.isValid(userId)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiErrors_1.default(404, "User not found for edit user");
    }
    // Update user's avatar with the new filename
    const updatedImage = yield prisma_1.default.user.update({
        where: { id: userId },
        data: {
            avatar: `${config_1.default.backend_base_url}/uploads/${file.filename}`,
        },
    });
    return updatedImage.avatar;
});
exports.authService = {
    loginUserIntoDB,
    getProfileFromDB,
    updateProfileIntoDB,
    loginAuthProvider,
    adminLoginAuth,
    updateProfileImageInDB,
    logoutUser
};
