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
const config_1 = __importDefault(require("../../config"));
const http_status_1 = __importDefault(require("http-status"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const prisma_1 = __importDefault(require("../../shared/prisma"));
const auth = (...roles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = req.headers.authorization;
            if (!token) {
                throw new ApiErrors_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized!");
            }
            const session = yield prisma_1.default.user.findFirst({
                where: { accessToken: token },
            });
            if (!session) {
                throw new ApiErrors_1.default(408, "Your session does not exist!");
            }
            const verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.jwt_secret);
            req.user = verifiedUser;
            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiErrors_1.default(http_status_1.default.FORBIDDEN, "Forbidden! You are not authorized");
            }
            next();
        }
        catch (err) {
            next(err);
        }
    });
};
exports.default = auth;
