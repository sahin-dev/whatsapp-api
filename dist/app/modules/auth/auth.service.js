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
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
const loginUserIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let accessToken;
    let userInfo;
    const user = yield prisma_1.default.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!user) {
        const createUser = yield prisma_1.default.user.create({
            data: Object.assign(Object.assign({}, payload), { fcmToken: payload.fcmToken, password: yield bcryptjs_1.default.hash(payload.password, 10) }),
        });
        accessToken = jwtHelpers_1.jwtHelpers.generateToken({
            id: createUser.id,
            email: createUser.email,
            role: createUser.role,
            fcmToken: createUser.fcmToken,
            subscription: createUser.subcription,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
        const { password, status, createdAt, updatedAt } = createUser, others = __rest(createUser, ["password", "status", "createdAt", "updatedAt"]);
        userInfo = others;
    }
    else {
        const isPasswordValid = yield bcryptjs_1.default.compare(payload.password, user.password);
        if (!isPasswordValid) {
            throw new ApiErrors_1.default(401, "Invalid credentials");
        }
        accessToken = jwtHelpers_1.jwtHelpers.generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            fcmToken: payload.fcmToken,
            subscription: user.subcription,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
        const updateUserInfo = yield prisma_1.default.user.update({
            where: {
                email: payload.email,
            },
            data: {
                fcmToken: payload.fcmToken,
                accessToken: accessToken,
            },
        });
        const { password, status, createdAt, updatedAt, accessToken: token } = updateUserInfo, others = __rest(updateUserInfo, ["password", "status", "createdAt", "updatedAt", "accessToken"]);
        userInfo = others;
    }
    return {
        accessToken,
        userInfo,
    };
});
// get profile for logged in user
const getProfileFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongodb_1.ObjectId.isValid(userId)) {
        throw new ApiErrors_1.default(400, "Invalid user ID format");
    }
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        include: { group: true },
    });
    if (!user) {
        throw new ApiErrors_1.default(404, "user not found!");
    }
    const { password, createdAt, updatedAt } = user, sanitizedUser = __rest(user, ["password", "createdAt", "updatedAt"]);
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
    const updatedUser = yield prisma_1.default.user.update({
        where: { id: userId },
        data: {
            username: userData.username,
        },
    });
    const { password } = updatedUser, sanitizedUser = __rest(updatedUser, ["password"]);
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
        where: { username: payload.username },
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
            where: { email: existingUser.email },
            data: {
                fcmToken: payload.fcmToken ? payload.fcmToken : existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
                accessToken: accessToken,
            },
        });
        const { password } = updatedUser, userInfo = __rest(updatedUser, ["password"]);
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
        where: { email: user.email },
        data: {
            password: bcryptjs_1.default.hashSync(payload.password, 10),
            fcmToken: payload.fcmToken ? payload.fcmToken : existingUser === null || existingUser === void 0 ? void 0 : existingUser.fcmToken,
            accessToken: accessToken,
        },
    });
    const { password } = updatedUser, userInfo = __rest(updatedUser, ["password"]);
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
        where: { username: payload.username },
    });
    if (!existingUser) {
        throw new ApiErrors_1.default(404, "Admin user not found");
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(payload.password, existingUser.password);
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
        where: { email: existingUser.email },
        data: {
            accessToken: authToken,
        },
    });
    const { password, accessToken } = updatedUser, userInfo = __rest(updatedUser, ["password", "accessToken"]);
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
};
