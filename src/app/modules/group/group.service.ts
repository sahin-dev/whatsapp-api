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
    ? `${config.backend_base_url}/uploads/${file.originalname}`
    : null;

  const existingGroup = await prisma.group.findFirst({
    where: { groupName: payload.groupName },
  });

  if (existingGroup) {
    throw new ApiError(409, "Group with the same name already exists");
  }
  
  const newGroup = await prisma.group.create({
    data: {
      ...payload,
      userId: userId,
      groupImage: imageUrl ? imageUrl : ""
    },
  });
  await prisma.groupUser.create({
    data:{
      userId:userId,
      groupId:newGroup.id
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
    ? `${config.backend_base_url}/uploads/${file.originalname}`
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
  const myGroups = await prisma.groupUser.findMany({where:{userId}})

  const groupIds = myGroups.map(group=> group.id)

  if (groupIds.length <= 0){
    return {message:"No Group"}
  }
  return groupIds
}

const addMember = async (memberId:string, groupId:string, userId:string) => {
  const group = await prisma.group.findUnique({where:{id:groupId}})

  if (group?.adminId !== userId){
    throw new ApiError (httpStatus.UNAUTHORIZED, 'You are not allowed to add member to this group')
  }
  await prisma.groupUser.create({data:{groupId, userId:memberId}})
  return {message:"User added to the group"}
}

const getAllGroupMembers = async (groupId:string,userId:string)=>{
  const group = await prisma.group.findUnique({where:{id:groupId}})
  const groupUsers = await prisma.groupUser.findMany({where:{groupId}})
  const targetMember = groupUsers.find((groupUser)=> groupUser.id === userId)

  if (group?.adminId !== userId || !targetMember){
    throw new ApiError (httpStatus.UNAUTHORIZED, "Sorry, you are not allowed to see the members.")
  }

  return groupUsers
}

const exitGroup  = async (groupId:string, userId:string)=>{
  const groupUser = await prisma.groupUser.findFirst({where:{groupId, userId}})
  if (!groupUser){
    throw new ApiError (httpStatus.NOT_FOUND, "You are already left from this group")
  }
  await prisma.groupUser.delete({where:{id:groupUser.id}})

  return {message:"Member leave from the group"}
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
  exitGroup
};
