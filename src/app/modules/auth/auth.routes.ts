import express from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";

const router = express.Router();

//login user
//tested
router.post("/login", validateRequest(authValidation.loginSchema), authController.loginUser);


//tested
router.get("/profile", auth(), authController.getProfile);


//tested
router.put(
  "/profile",
  validateRequest(authValidation.updateProfileSchema),
  auth(),
  authController.updateProfile
);

//tested

router.patch(
  "/update/profile-image",
  fileUploader.uploadProfileImage,
  auth(),
  authController.updateProfileImage
);

//tested
router.post('/logout', auth(), authController.logout)

//Not required
router.post("/login-with-auth", authController.loginWithAuth);
router.post("/admin-login", authController.adminLogin);


export const authRoute = router;
