import { Router } from "express";
import auth from "../../middlewares/auth";
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
router.get("/access/groups", auth(), groupControllers.accessGroups);

//mute notification


//new routes

router.get('/my-groups', auth(), groupControllers.getMyGroups)
router.get('/messages/:groupId', auth(), groupControllers.getGroupMessages)

router.post ("/add/:memberId/:groupId", auth(), groupControllers.addMember)

router.get("/users/:groupId", auth(), groupControllers.getAllGroupMembers)

//after leave if there is no admin automatically select oldest user make the user admin
router.post("/leave/:groupId", auth(), groupControllers.exitGroup)
//make a user admin
router.post("/make-admin/:groupId/:userId",auth(), groupControllers.makeAdmin)

router.post("/toggle-notification/:groupId", auth(), groupControllers.toggoleNotification)

router.post("/remove/:groupId/:userId", auth(), groupControllers.removeUserFromGroup)

router.get("/search/:groupId", auth(), groupControllers.searchGroupUser)

router.get("/bio/:groupId", auth(), groupControllers.getGroupBio)

router.put('/bio/:groupId', auth(), groupControllers.updateGroupBio)




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

export const groupRoutes = router;
