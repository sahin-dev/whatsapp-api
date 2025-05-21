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
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
//tested
router.get("/:id", (0, auth_1.default)(), user_controller_1.UserControllers.getSingleUser);
//tested
router.delete("/", (0, auth_1.default)(), user_controller_1.UserControllers.deleteUser);
router.put("/", (0, auth_1.default)(), (0, validateRequest_1.default)(user_validation_1.userValidation.userUpdateValidationSchema), user_controller_1.UserControllers.updateUser);
//not required
// router.get(
//   "/",
//   auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   UserControllers.getUsers
// );
// // router.get("/:id", auth(), UserControllers.getSingleUser);
// router.put(
//   "/:id",
//   validateRequest(userValidation.userUpdateValidationSchema),
//   auth(UserRole.ADMIN),
//   UserControllers.updateUser
// );
exports.userRoutes = router;
