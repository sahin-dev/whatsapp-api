"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_validation_1 = require("./user.validation");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), user_controller_1.UserControllers.getUsers);
router.get("/:id", (0, auth_1.default)(), user_controller_1.UserControllers.getSingleUser);
router.put("/:id", (0, validateRequest_1.default)(user_validation_1.userValidation.userUpdateValidationSchema), (0, auth_1.default)(client_1.UserRole.ADMIN), user_controller_1.UserControllers.updateUser);
router.delete("/:id", (0, auth_1.default)(client_1.UserRole.ADMIN), user_controller_1.UserControllers.deleteUser);
exports.userRoutes = router;
