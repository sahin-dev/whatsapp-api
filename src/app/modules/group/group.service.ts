import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import config from "../../../config";
import { Request } from "express";
import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import { group } from "console";

const createGroupInDB = async (req: any) => {
  const payload = req.body;
  const userId = req.user.id;
  const file = req.file;
  // if (!file) {
  //   throw new ApiError(400, "No file attached");
  // }
  const imageUrl = file
    ? `${config.backend_base_url}/uploads/${file.filename}`
    : null;
  
  // const existingGroup = await prisma.group.findFirst({
  //   where: { groupName: payload.groupName },
  // });

  // if (existingGroup) {
  //   throw new ApiError(409, "Group with the same name already exists");
  // }
  
  const newGroup = await prisma.group.create({
    data: {
      ...payload,
      adminId: userId,
      groupImage: imageUrl ? imageUrl : ""
    },
  });
  
  await prisma.groupUser.create({
    data:{
      userId:userId,
      groupId:newGroup.id,
      isAdmin:true,
    
    }
  })

  return newGroup;
};


const getGroupsInDB = async () => {
  const groups = await prisma.group.findMany({
    include: { channel: true },
    orderBy: { createdAt: "desc" },
  });

  if (groups.length === 0) {
    throw new ApiError(404, "Group not found");
  }
  return groups;
};

const getGroupInDB = async (groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { channel: true },
  });
  
  if (!group) {
    throw new ApiError(404, "Group not found");
  }
  return group;
};

const updateGroupInDB = async (req: Request) => {
  const payload = req.body;
  const groupId = req.params.groupId;
  const file = req.file;
  const imageUrl = file
    ? `${config.backend_base_url}/uploads/${file.filename}`
    : null;
  const existingGroup = await prisma.group.findUnique({
    where: { id: groupId },
  });
  if (!existingGroup) {
    throw new ApiError(404, "Group not found for update");
  }
  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...payload,
      groupImage: imageUrl ? imageUrl : existingGroup.groupImage,
    },
  });
  return updatedGroup;
};

const deleteGroupInDB = async (groupId: string) => {
  const existingGroup = await prisma.group.findUnique({
    where: { id: groupId },
  });
  if (!existingGroup) {
    throw new ApiError(404, "Group not found for delete");
  }
  await prisma.group.delete({ where: { id: groupId } });

  return;
};

const accessGroupInDB = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const allGroups = await prisma.group.findMany({
    include: {
      channel: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (user?.role === UserRole.USER) {
    const mySubscriptions = await prisma.subscription.findMany({
      where: { userId: userId },
    });

    const accessibleGroups = allGroups.filter((group) =>
      mySubscriptions.some((sub) => sub.group === group.groupName)
    );
    return accessibleGroups;
  } else {
    return allGroups;
  }
};


//new services

const getMyGroups = async (userId:string)=>{

  const myGroups = await prisma.groupUser.findMany({where:{userId},include:{group:true,}})
  
  const groupData =   myGroups.map(async (myGroup)=> {
    const message = await prisma.userMessage.findFirst({where:{groupId:myGroup.group.id},orderBy:{createdAt:'desc'}})
    console.log(message)
    const totalUnreadMessage = await prisma.userMessage.count({where:{groupId:myGroup.group.id, isRead:false}})

    return {
      id:myGroup.group.id,
      name:myGroup.group.groupName,
      image:myGroup.group.groupImage,
      recentMessage:{
        message:message?.message,
        createdAt:message?.createdAt
      },
      totalUnreadMessage

    }
  })

  // const groupMessage = await prisma.userMessage.findMany({where:{id:{in:groupIds}},orderBy:{createdAt:"desc"}, include:{group:true}})
  
  return Promise.all(groupData)
}

const addMember = async (memberId:string, groupId:string, userId:string) => {
  const groupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId}}})
  
  if (!groupUser?.isAdmin){
    throw new ApiError (httpStatus.UNAUTHORIZED, 'You are not allowed to add member to this group')
  }
  const existingGroupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId:memberId}}})
  if (existingGroupUser){
    throw new ApiError(httpStatus.CONFLICT, "User already added to the group")
  }
  await prisma.groupUser.create({data:{groupId, userId:memberId}})
  return {message:"User added to the group"}
}

//get all members of a specific group

const getAllGroupMembers = async (groupId:string,userId:string)=>{

  const group = await prisma.group.findUnique({where:{id:groupId}})
  const groupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId}}})
  if (!groupUser){
    throw new ApiError (httpStatus.UNAUTHORIZED, "Sorry, you are not allowed to see the members.")
  }
  
  const groupUsers = await prisma.groupUser.findMany({where:{groupId},include:{user:true}})

  let mappedUsers = groupUsers.map(groupUser => {
    return {name:groupUser.user.name,image:groupUser.user.avatar, phone:groupUser.user.phone, admin:groupUser.isAdmin}
  })

  return mappedUsers
}

//exit from the group by the user him/herself

const exitGroup  = async (groupId:string, userId:string)=>{

  const exitedGroupuser = await prisma.groupUser.findFirst({where:{groupId, userId}})

  if (!exitedGroupuser){
    throw new ApiError (httpStatus.NOT_FOUND, "You are not member of this group")
  }
//remove user from the group
  await prisma.groupUser.delete({where:{id:exitedGroupuser.id}})

  //count group admin
  const countGroupAdmin = await prisma.groupUser.count({where:{groupId,isAdmin:true}})

  //check rest admins of the group
  if (countGroupAdmin === 0){
    const restGroupUser = await prisma.groupUser.findFirst({where:{groupId},orderBy:{createdAt:"desc"}})

    if (!restGroupUser){
      //delete the group is there are no group member remains
      await prisma.group.delete({where:{id:groupId}})

    }else{
      //make older member admin
      await prisma.groupUser.update({where:{id:restGroupUser.id},data:{isAdmin:true}})
    }
    
  }

  return {message:"left from the group"}
}

//make  a user admin by a group admin

const makeAdmin = async (adminId:string,groupId:string, userId:string)=>{

  const groupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId:adminId}}})

  if (!groupUser||  !groupUser.isAdmin){
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are authoized to make admin')
  }

  const generalUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId}}})
  if (!generalUser){
    throw new ApiError(httpStatus.NOT_FOUND, "User not found")
  }


  let adminUser = await prisma.groupUser.update({where:{id:generalUser.id}, data:{isAdmin:true}})
  return adminUser
}

//remove a user by an admin

const removeUserFromGroup = async (adminId:string, groupId:string, userId:string)=>{
  const groupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId:adminId}}})

  if (!groupUser || !groupUser.isAdmin){
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authroized to leave user from group")
  }

  const generaluser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId}}})
  if(!generaluser || !generaluser.isAdmin){
    throw new ApiError(httpStatus.BAD_REQUEST, "Could not remove the user")
  }
  
  await prisma.groupUser.delete({where:{id:generaluser.id}})

  return {message:"User removed successfully"}
}

//toggole notificaiton
const toggoleNotification = async (groupId:string, userId:string)=>{
  const groupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId}}})

  if (!groupUser){
    throw new ApiError(httpStatus.NOT_FOUND, "Group User not found")
  }
  await prisma.groupUser.update({where:{id:groupUser.id}, data:{isMuted:!groupUser.isMuted}})

  return {message:"Notificaton toggoled successfully"}

}

///report a group by a user

const reportGroup = async (groupId:string, userId:string)=>{

}


//search group user

const searchGroupUser = async (groupId: string, q: string) => {
  const groupUsers = await prisma.groupUser.findMany({
    where: { groupId },
    include: {
      user: true
    }
  });
  // Filter users by name after fetching
  const filteredUsers =  groupUsers.filter(groupUser =>groupUser.user && groupUser.user.name?.toLowerCase().includes(q.toLowerCase())
    
    
  );
  
  return filteredUsers.map(filterUser => {
    return  {
      name:filterUser.user.name,
      phone:filterUser.user.phone,
      avatar:filterUser.user.avatar,
      isAdmin:filterUser.isAdmin
    }
  })
}

//get group bio

const getGroupBio = async (groupId:string)=>{
  const group = await prisma.group.findUnique({where:{id:groupId}})
  if (!group){
    throw new ApiError(httpStatus.NOT_FOUND, "Group not found")
  }
  const groupBio = {descripton:group.about,createdAt:group.createdAt}

  return groupBio
}

//edit group bio

const editGroupBio = async (userId:string, groupId:string, payload:any)=>{

  const groupUser = await prisma.groupUser.findUnique({where:{groupId_userId:{groupId,userId}}})

  if (!groupUser || !groupUser.isAdmin){
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized to edit bio")
  }

  const updatedGroup = await prisma.group.update({where:{id:groupId},data:{about:payload.about}})

  return updatedGroup

}

const getGroupMessages = async (groupId: string) => {
  const messages = await prisma.userMessage.findMany({  
    where: { groupId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    
  });

  // const user = await prisma.groupUser.findFirst({
  //   where: { groupId, userId:messages },  
  //   include: { user: true },
  // });
  // if (messages.length === 0) {
  //   throw new ApiError(404, "No messages found in this group");
  // }
  return messages
}
export const groupServices = {
  createGroupInDB,
  getGroupsInDB,
  getGroupInDB,
  updateGroupInDB,
  deleteGroupInDB,
  accessGroupInDB,

  //new

  getMyGroups,
  addMember,
  getAllGroupMembers,
  exitGroup,
  toggoleNotification,
  makeAdmin,
  removeUserFromGroup,
  reportGroup,
  searchGroupUser,
  getGroupBio,
  editGroupBio,
  getGroupMessages


};
