import express from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";

const router = express.Router();

//login user
router.post("/login", authController.loginUser);

router.get("/profile", auth(), authController.getProfile);

router.put(
  "/profile",
  validateRequest(authValidation.updateProfileSchema),
  auth(),
  authController.updateProfile
);

router.post("/login-with-auth", authController.loginWithAuth);
router.post("/admin-login", authController.adminLogin);
router.patch(
  "/update/profile-image",
  fileUploader.updateProfileImage,
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  authController.updateProfileImage
);

export const authRoute = router;
