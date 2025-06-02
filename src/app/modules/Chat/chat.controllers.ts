import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { chatServices } from "./chat.services";
import sendResponse from "../../../shared/sendResponse";
import { User } from "@prisma/client";
import httpStatus from "http-status";

// create a new group
const createGroup = catchAsync(async (req: Request, res: Response) => {
    // const {participantId} = req.params
    const result = await chatServices.createGroupInDB(req);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "New chat created successfully",
        data: result,
    });
});

const getRoomById = catchAsync(async (req: any, res: Response) => {
  const { roomId } = req.params;
  const user = req.user
    const room = await chatServices.getRoomById(user.id,roomId);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Room retrieved successfully",
        data: room,
    });
})

// get all groups
const getAllGroups = catchAsync(async (req: Request, res: Response) => {
  const groups = await chatServices.getGroupsInDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chats retrieved",
    data: groups,
  });
});

// get single group
const getSingleGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await chatServices.getGroupInDB(req.params.groupId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chat retrived successfully",
    data: group,
  });
});

// update group
const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const updatedGroup = await chatServices.updateGroupInDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chat updated successfully",
    data: updatedGroup,
  });
});

// delete group
const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.chatId;
  await chatServices.deleteGroupInDB(groupId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group deleted successfully",
  });
});

// get access group
const accessGroups = catchAsync(async (req: any, res: Response) => {
 
  const user = req.user as User;

  const userId = user.id;
  const accessGroups = await chatServices.accessGroupInDB(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access groups retrieved successfully",
    data: accessGroups,
  });
});

//new Controllers

const getMyGroups = catchAsync(async (req:any, res:Response)=>{
  const user = req.user
  console.log(user)
  const myGroupInfo = await chatServices.getMyGroups(user.id)
  console.log(myGroupInfo)
  sendResponse(res,{
    statusCode:httpStatus.OK,
    success:true,
    message:"Groups fetched successfully.",
    data:myGroupInfo
  })
})

// const addMember = catchAsync (async (req:any, res:Response)=>{
//   const user = req.user
//   const groupId = req.params.chatId
//   const memberId = req.params.memberId

//   const result = await chatServices.addMember(memberId,groupId, user.id)

//   sendResponse (res, {
//     statusCode:200,
//     success:true,
//     message:"Member add to the group",
//     data:result
//   })

// })

// const addMemberByPhone = catchAsync (async (req:any, res:Response)=>{
//   const user = req.user
//   const groupId = req.params.chatId
//   const {phone} = req.body

//   const result = await chatServices.addMemberByPhone(phone,groupId, user.id)

//   sendResponse (res, {
//     statusCode:200,
//     success:true,
//     message:"Member add to the group",
//     data:result
//   })

// } )

// const getAllGroupMembers = catchAsync (async (req:any, res:Response)=>{
//   const user = req.user
//   const groupId = req.params.chatId


//   const result = await chatServices.getAllGroupMembers(groupId, user.id)

//   sendResponse (res, {
//     statusCode:200,
//     success:true,
//     message:"All group members fetched successfully",
//     data:result
//   })

// })

// const exitGroup = catchAsync (async (req:any, res:Response)=>{
//   const user = req.user
//   const groupId = req.params.chatId


//   const result = await chatServices.exitGroup(groupId, user.id)

//   sendResponse (res, {
//     statusCode:200,
//     success:true,
//     message:"Member left from the group",
//     data:result
//   })

// })


// const toggoleNotification = catchAsync(async (req:any, res:Response)=>{
//   const userId = req.user.id
//   const groupId = req.params.chatId

//   await chatServices.toggoleNotification(groupId,userId)

//   sendResponse(res, {
//     success:true,
//     statusCode:httpStatus.OK,
//     message:"Notification toggoled successfully"
//   })
// })

// const makeAdmin = catchAsync(async (req:any, res:Response)=>{
//   const adminId = req.user.id
//   const {chatId, userId} = req.params

//   const admin = await chatServices.makeAdmin(adminId,chatId, userId)

//   sendResponse(res, {
//     success:true,
//     statusCode:httpStatus.OK,
//     message:"Group admin added successfully",
//     data:admin
//   })
// })

// const removeUserFromGroup = catchAsync(async (req:any, res:Response)=>{
//   const adminId = req.user.id
//   const {chatId, userId} = req.params

//   const admin = await chatServices.removeUserFromGroup(adminId,chatId, userId)

//   sendResponse(res, {
//     success:true,
//     statusCode:httpStatus.OK,
//     message:"user removed from the group successfully",
//     data:admin
//   })
// })

// const searchGroupUser = catchAsync(async (req:any,res:Response)=>{
//     const {q} = req.query
//     const {chatId} = req.params

//     const result = await chatServices.searchGroupUser(chatId, q)

//     sendResponse(res, {
//       success:true,
//       statusCode:httpStatus.OK,
//       message:"Group User fetched successfully",
//       data:result
//     })
// })

// const getGroupBio = catchAsync(async (req:any, res:Response)=>{
//     const {chatId} = req.params
//     const result = await chatServices.getGroupBio(chatId)

//     sendResponse(res, {
//       success:true,
//       statusCode:httpStatus.OK,
//       message:"Group User fetched successfully",
//       data:result
//     })
// })



// const updateGroupBio = catchAsync(async (req:any, res:Response)=>{
//     const {chatId} = req.params
//     const userId = req.user.id
//     const payload = req.body
//     const result = await chatServices.editGroupBio(userId,chatId, payload)

//     sendResponse(res, {
//       success:true,
//       statusCode:httpStatus.OK,
//       message:"Group User fetched successfully",
//       data:result
//     })
// })

const getGroupMessages = catchAsync(async (req:any, res:Response)=>{
  const {chatId} = req.params
  const userId = req.user.id

  const messages = await chatServices.getGroupMessages(chatId, userId)

  sendResponse(res, {
    success:true,
    statusCode:httpStatus.OK,
    message:"Group messages fetched successfully",
    data:messages
  })
})

export const chatControllers = {
  createGroup,
  getAllGroups,
  getSingleGroup,
  updateGroup,
  deleteGroup,
  accessGroups,
  getRoomById,

  //new
  getMyGroups,
//   addMember,
//   addMemberByPhone,
//   getAllGroupMembers,

//   exitGroup,
//   toggoleNotification,
//   makeAdmin,
//   removeUserFromGroup,
//   searchGroupUser,
//   getGroupBio,
//   updateGroupBio,
  getGroupMessages
  

};
