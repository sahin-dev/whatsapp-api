import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { fileUploader } from "../../../helpers/fileUploader";
import { chanelControllers } from "./chanel.controller";

const router = Router();

//tested
router.post(
  "/create/:groupId",
  // fileUploader.uploadChanelImage,
  parseBodyData,
  auth(),
  chanelControllers.createChanel
);


//tested
router.get(
  "/",
  auth(),
  chanelControllers.getAllChanels
);

//tested
router.get(
  "/access-channels/:groupId",
  auth(),
  chanelControllers.getAccessChannels
);

//tested
router.get("/:chanelId", auth(), chanelControllers.getSingleChanel);


router.put(
  "/:chanelId",
  // fileUploader.uploadChanelImage,
  parseBodyData,
  auth(UserRole.SUPER_ADMIN),
  chanelControllers.updateChanel
);
router.delete(
  "/:chanelId",
  auth(UserRole.SUPER_ADMIN),
  chanelControllers.deleteChanel
);
router.post(
  "/add-member/:channelId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  chanelControllers.addMember
);
router.post(
  "/remove-member/:channelId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  chanelControllers.removeMember
);
router.get(
  "/:channelId/members",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  chanelControllers.getAllMembersInchannel
);

router.get("/:channelId/files", auth(), chanelControllers.channelFiles);
router.get("/recordings/:channelId", auth(), chanelControllers.recordingFiles);
router.get(
  "/recordings/:channelId/:channelUid",
  auth(),
  chanelControllers.singleRecordingFile
);

export const chanelRoutes = router;
