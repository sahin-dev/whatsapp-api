"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
//login user
router.post("/login", auth_controller_1.authController.loginUser);
router.get("/profile", (0, auth_1.default)(), auth_controller_1.authController.getProfile);
router.put("/profile", (0, validateRequest_1.default)(auth_validation_1.authValidation.updateProfileSchema), (0, auth_1.default)(), auth_controller_1.authController.updateProfile);
router.post("/login-with-auth", auth_controller_1.authController.loginWithAuth);
router.post("/admin-login", auth_controller_1.authController.adminLogin);
exports.authRoute = router;
