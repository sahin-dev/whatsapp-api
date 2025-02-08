"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authZeroRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_zero_controller_1 = require("./auth-zero.controller");
const router = express_1.default.Router();
router.get("/logged-status", auth_zero_controller_1.authZeroControllers.loggedStatus);
exports.authZeroRoutes = router;
