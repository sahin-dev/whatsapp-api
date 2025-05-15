import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { groupControllers } from "./group.controller";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { fileUploader } from "../../../helpers/fileUploader";

const router = Router();

//tested
router.post(
  "/create",
  fileUploader.uploadGroupImage,
  auth(),
  parseBodyData,
  groupControllers.createGroup
);

//tested
router.get(
  "/",
  auth(),
  groupControllers.getAllGroups
);

//tested
router.get("/:groupId", auth(), groupControllers.getSingleGroup);

//tested
router.put(
  "/:groupId",
  fileUploader.uploadGroupImage,
  auth(),
  parseBodyData,
  groupControllers.updateGroup
);

//tested
router.delete(
  "/:groupId",
  auth(),
  groupControllers.deleteGroup
);
//tested
router.get("/access/groups", auth(), groupControllers.accessGroups);



//new routes

router.get('/my-groups', auth(), groupControllers.getMyGroups)



export const groupRoutes = router;
