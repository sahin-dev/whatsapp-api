import express from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";
import auth from "../../middlewares/auth";

const router = express.Router();

//login user
router.post(
  "/login",
  validateRequest(authValidation.authLoginSchema),
  authController.loginUser
);

router.get("/profile", auth(), authController.getProfile);

router.put(
  "/profile",
  validateRequest(authValidation.updateProfileSchema),
  auth(),
  authController.updateProfile
);

export const authRoute = router;
