import { Router } from "express";
import auth from "../../middlewares/auth";
import { chatControllers } from "./chat.controllers";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { fileUploader } from "../../../helpers/fileUploader";



const router = Router();



//tested
router.get(
  "/",
  auth(),
  chatControllers.getAllGroups
);

//tested
router.get("/access/chats", auth(), chatControllers.accessGroups);

//mute notification


//new routes

router.get('/my-chats', auth(), chatControllers.getMyGroups)

router.get('/messages/:chatId', auth(), chatControllers.getGroupMessages)

//tested
router.post(
  "/:participantId",
  auth(),
  parseBodyData,
  chatControllers.createGroup
);

router.get("/:roomId", auth(), chatControllers.getRoomById);



// router.post ("/add/:memberId/:chatId", auth(), chatControllers.addMember)
// router.post('/add/:chatId', auth(), chatControllers.addMemberByPhone)

// router.get("/users/:chatId", auth(), chatControllers.getAllGroupMembers)

// //after leave if there is no admin automatically select oldest user make the user admin
// router.post("/leave/:chatId", auth(), chatControllers.exitGroup)
// //make a user admin
// router.post("/make-admin/:chatId/:userId",auth(), chatControllers.makeAdmin)

// router.post("/toggle-notification/:chatId", auth(), chatControllers.toggoleNotification)

// router.post("/remove/:chatId/:userId", auth(), chatControllers.removeUserFromGroup)

// router.get("/search/:chatId", auth(), chatControllers.searchGroupUser)

// router.get("/bio/:chatId", auth(), chatControllers.getGroupBio)

// router.put('/bio/:chatId', auth(), chatControllers.updateGroupBio)




//tested
router.get("/:chatId", auth(), chatControllers.getSingleGroup);

//tested
router.put(
  "/:chatId",
  fileUploader.groupImageUploader,
  auth(),
  parseBodyData,
  chatControllers.updateGroup
);

//tested
router.delete(
  "/:chatId",
  auth(),
  chatControllers.deleteGroup
);

export const chatRoutes = router;
