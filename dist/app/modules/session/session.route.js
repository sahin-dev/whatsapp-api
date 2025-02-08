"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRoute = void 0;
const express_1 = __importDefault(require("express"));
const session_controller_1 = require("./session.controller");
const router = express_1.default.Router();
//login user
router.get("/:token", session_controller_1.SessionController.checkSession);
exports.sessionRoute = router;
