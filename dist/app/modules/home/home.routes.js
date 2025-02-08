"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeContentRoute = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const home_controller_1 = require("./home.controller");
const router = express_1.default.Router();
router.post("/create", (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN), home_controller_1.homeContentController.createHomeContent);
router.get("/", home_controller_1.homeContentController.getHomeContent);
exports.homeContentRoute = router;
