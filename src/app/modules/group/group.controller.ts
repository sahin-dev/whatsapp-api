import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { groupServices } from "./group.service";
import sendResponse from "../../../shared/sendResponse";
import { User } from "@prisma/client";
import httpStatus from "http-status";

// create a new group
const createGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await groupServices.createGroupInDB(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "New group created successfully",
    data: result,
  });
});

// get all groups
const getAllGroups = catchAsync(async (req: Request, res: Response) => {
  const groups = await groupServices.getGroupsInDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Groups retrieved",
    data: groups,
  });
});

// get single group
const getSingleGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await groupServices.getGroupInDB(req.params.groupId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group retrived successfully",
    data: group,
  });
});

// update group
const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const updatedGroup = await groupServices.updateGroupInDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group updated successfully",
    data: updatedGroup,
  });
});

// delete group
const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  await groupServices.deleteGroupInDB(groupId);
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
  const accessGroups = await groupServices.accessGroupInDB(userId);
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
 
  const myGroupInfo = await groupServices.getMyGroups(user.id)
  console.log(myGroupInfo)
  sendResponse(res,{
    statusCode:httpStatus.OK,
    success:true,
    message:"Groups fetched successfully.",
    data:myGroupInfo
  })
})

const addMember = catchAsync (async (req:any, res:Response)=>{
  const user = req.user
  const groupId = req.params.groupId
  const memberId = req.params.memberId

  const result = await groupServices.addMember(memberId,groupId, user.id)

  sendResponse (res, {
    statusCode:200,
    success:true,
    message:"Member add to the group",
    data:result
  })

})

const addMemberByPhone = catchAsync (async (req:any, res:Response)=>{
  const user = req.user
  const groupId = req.params.groupId
  const {phone} = req.body

  const result = await groupServices.addMemberByPhone(phone,groupId, user.id)

  sendResponse (res, {
    statusCode:200,
    success:true,
    message:"Member add to the group",
    data:result
  })

} )

const getAllGroupMembers = catchAsync (async (req:any, res:Response)=>{
  const user = req.user
  const groupId = req.params.groupId


  const result = await groupServices.getAllGroupMembers(groupId, user.id)

  sendResponse (res, {
    statusCode:200,
    success:true,
    message:"All group members fetched successfully",
    data:result
  })

})

const exitGroup = catchAsync (async (req:any, res:Response)=>{
  const user = req.user
  const groupId = req.params.groupId


  const result = await groupServices.exitGroup(groupId, user.id)

  sendResponse (res, {
    statusCode:200,
    success:true,
    message:"Member left from the group",
    data:result
  })

})


const toggoleNotification = catchAsync(async (req:any, res:Response)=>{
  const userId = req.user.id
  const groupId = req.params.groupId

  await groupServices.toggoleNotification(groupId,userId)

  sendResponse(res, {
    success:true,
    statusCode:httpStatus.OK,
    message:"Notification toggoled successfully"
  })
})

const makeAdmin = catchAsync(async (req:any, res:Response)=>{
  const adminId = req.user.id
  const {groupId, userId} = req.params

  const admin = await groupServices.makeAdmin(adminId,groupId, userId)

  sendResponse(res, {
    success:true,
    statusCode:httpStatus.OK,
    message:"Group admin added successfully",
    data:admin
  })
})

const removeUserFromGroup = catchAsync(async (req:any, res:Response)=>{
  const adminId = req.user.id
  const {groupId, userId} = req.params

  const admin = await groupServices.removeUserFromGroup(adminId,groupId, userId)

  sendResponse(res, {
    success:true,
    statusCode:httpStatus.OK,
    message:"user removed from the group successfully",
    data:admin
  })
})

const searchGroupUser = catchAsync(async (req:any,res:Response)=>{
    const {q} = req.query
    const {groupId} = req.params

    const result = await groupServices.searchGroupUser(groupId, q)

    sendResponse(res, {
      success:true,
      statusCode:httpStatus.OK,
      message:"Group User fetched successfully",
      data:result
    })
})

const getGroupBio = catchAsync(async (req:any, res:Response)=>{
    const {groupId} = req.params
    const result = await groupServices.getGroupBio(groupId)

    sendResponse(res, {
      success:true,
      statusCode:httpStatus.OK,
      message:"Group User fetched successfully",
      data:result
    })
})



const updateGroupBio = catchAsync(async (req:any, res:Response)=>{
    const {groupId} = req.params
    const userId = req.user.id
    const payload = req.body
    const result = await groupServices.editGroupBio(userId,groupId, payload)

    sendResponse(res, {
      success:true,
      statusCode:httpStatus.OK,
      message:"Group User fetched successfully",
      data:result
    })
})

const getGroupMessages = catchAsync(async (req:any, res:Response)=>{
  const {groupId} = req.params
  const userId = req.user.id

  const messages = await groupServices.getGroupMessages(groupId)

  sendResponse(res, {
    success:true,
    statusCode:httpStatus.OK,
    message:"Group messages fetched successfully",
    data:messages
  })
})


export const groupControllers = {
  createGroup,
  getAllGroups,
  getSingleGroup,
  updateGroup,
  deleteGroup,
  accessGroups,

  //new
  getMyGroups,
  addMember,
  addMemberByPhone,
  getAllGroupMembers,

  exitGroup,
  toggoleNotification,
  makeAdmin,
  removeUserFromGroup,
  searchGroupUser,
  getGroupBio,
  updateGroupBio,
  getGroupMessages
  

};
