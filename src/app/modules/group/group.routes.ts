import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { groupControllers } from "./group.controller";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { fileUploader } from "../../../helpers/fileUploader";

const router = Router();

router.post(
  "/create",
  fileUploader.uploadGroupImage,
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  parseBodyData,
  groupControllers.createGroup
);
router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  groupControllers.getAllGroups
);
router.get("/:groupId", auth(), groupControllers.getSingleGroup);
router.put(
  "/:groupId",
  fileUploader.uploadGroupImage,
  auth(UserRole.SUPER_ADMIN),
  parseBodyData,
  groupControllers.updateGroup
);
router.delete(
  "/:groupId",
  auth(UserRole.SUPER_ADMIN),
  groupControllers.deleteGroup
);
router.get("/access/groups", auth(), groupControllers.accessGroups);
export const groupRoutes = router;
