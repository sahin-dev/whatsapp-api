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
const fileUploader_1 = require("../../../helpers/fileUploader");
const router = express_1.default.Router();
//login user
//tested
router.post("/login", (0, validateRequest_1.default)(auth_validation_1.authValidation.loginSchema), auth_controller_1.authController.loginUser);
//tested
router.get("/profile", (0, auth_1.default)(), auth_controller_1.authController.getProfile);
//tested
router.put("/profile", (0, validateRequest_1.default)(auth_validation_1.authValidation.updateProfileSchema), (0, auth_1.default)(), auth_controller_1.authController.updateProfile);
//tested
router.patch("/update/profile-image", fileUploader_1.fileUploader.updateProfileImage, (0, auth_1.default)(), auth_controller_1.authController.updateProfileImage);
//tested
router.post('/logout', (0, auth_1.default)(), auth_controller_1.authController.logout);
//Not required
router.post("/login-with-auth", auth_controller_1.authController.loginWithAuth);
router.post("/admin-login", auth_controller_1.authController.adminLogin);
exports.authRoute = router;
