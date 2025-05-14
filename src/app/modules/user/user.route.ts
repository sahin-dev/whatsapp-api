import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

//tested
router.get("/:id", auth(), UserControllers.getSingleUser);
//tested
router.delete("/", auth(), UserControllers.deleteUser);


//not required

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserControllers.getUsers
);
// router.get("/:id", auth(), UserControllers.getSingleUser);
router.put(
  "/:id",
  validateRequest(userValidation.userUpdateValidationSchema),
  auth(UserRole.ADMIN),
  UserControllers.updateUser
);


export const userRoutes = router;
