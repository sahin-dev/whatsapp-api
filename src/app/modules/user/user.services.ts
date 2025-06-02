import { GroupType, PrismaClient } from "@prisma/client";
import ApiError from "../../errors/ApiErrors";
const prisma = new PrismaClient();
import { ObjectId } from "mongodb";
import { Request } from "express";
import { searchFilter } from "../../../shared/searchFilter";
import httpStatus from "http-status";
import { get } from "http";
import { groupServices } from "../group/group.service";
import { group } from "console";


//get single user
const getSingleUserIntoDB = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const user = await prisma.user.findUnique({ where: { id }, select:{name:true,id:true,phone:true,avatar:true}});
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const {  ...sanitizedUser } = user;
  return sanitizedUser;
};

//get all users
const getUsersIntoDB = async (req: Request) => {
  const { search } = req.query as any;
  const searchFilters = search ? searchFilter(search) : {};
  const users = await prisma.user.findMany({
    where: searchFilters
  });
  const sanitizedUsers = users.map((user) => {
    const {  accessToken, ...sanitizedUser } = user;
    return sanitizedUser;
  });
  return sanitizedUsers;
};

//update user
const updateUserIntoDB = async (id: string, userData: any) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const existingUser = await getSingleUserIntoDB(id);
  if (!existingUser) {
    throw new ApiError(404, "user not found for edit user");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: userData,
  });


  return updatedUser;
};

//delete user
const deleteUserIntoDB = async (userId: string) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  // if (userId === loggedId) {
  //   throw new ApiError(403, "You can't delete your own account!");
  // }
  const existingUser = await getSingleUserIntoDB(userId);
  if (!existingUser) {
    throw new ApiError(404, "user not found for delete this");
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  return;
};

const blockUser = async (myId:string, blockingId:string)=>{
  const user = await prisma.user.findUnique({where:{id:blockingId}})
 
  
  if (!user){
    throw new ApiError(httpStatus.NOT_FOUND, "user not found")
  }
  const blockedUser = await prisma.blockUser.findUnique({where:{blockedId_blockerId:{blockedId:user.id,blockerId:myId}}})

  if (blockedUser){
    await prisma.blockUser.delete({where:{id:blockedUser.id}})
    return {message:"User unblocked successfully"}
  }
  await prisma.blockUser.create({data:{blockerId:myId, blockedId:user.id}})
  return {message:"User blocked successfully"}
}

const searchUser = async (phone:string, userId:string)=>{
  const user = await prisma.user.findUnique({where:{phone},select:{id:true, avatar:true,name:true,email:true,phone:true}})
  const contactList = await prisma.contactList.findUnique({where:{ownerId:userId}})
  if (!contactList || !contactList.id) {
    throw new ApiError(404, "Contact list not found for this user");
  }
  if (!user)  {
    throw new ApiError(404, "User not found with this phone number");
  }

    await prisma.contacts.create({data:{contactListId:contactList.id, contactId:user.id}})
  

  return user

}

const getContacts = async (userId:string)=>{
  console.log("userId", userId)
  const contactList = await prisma.contactList.findUnique({where:{ownerId:userId}})
  if (!contactList || !contactList.id) {
    throw new ApiError(404, "Contact list not found for this user");
  }
  const contacts = await prisma.contacts.findMany({
    where:{contactListId:contactList.id},
    select:{contactId:true}
  })
  const contactIds = contacts.map(c=>c.contactId)
  const users = await prisma.user.findMany({where:{id:{in:contactIds}},select:{id:true, avatar:true,name:true,email:true,phone:true}})
  return users
}

const searchMessageFromDB = async (userId: string, search: string) => {
  if (search === undefined) { 
    return [];
  }
  
  const myGroups = await prisma.group.findMany({where:{groupUsers:{some:{userId}}},select:{id:true}});
  const myRooms = await prisma.group.findMany({where:{groupUsers:{some:{userId}},groupType:GroupType.ROOM},select:{id:true}});

  
  console.log(myGroups, myRooms)
  const groupsMessages  = await prisma.userMessage.findMany({
    where: {
      groupId: { in: myGroups.map(group => group.id) },
      senderId:{not:userId},
  
      message: {
        contains: search || "",
        mode: 'insensitive',
      },
    },include:{group:true}
  });

  // return groupsMessages

  console.log("groupsMessages", groupsMessages)

  const messages =  await groupsMessages.map(async (message) => {
   
    if (message.group?.groupType === GroupType.GROUP) {
      return {
        groupId: message.groupId,
        message: message.message,
        groupType: message.group?.groupType,
        groupName: message.group?.groupName,
        groupAvatar: message.group?.groupImage,
      };
    }
      else if (message.group?.groupType === GroupType.ROOM) {
        const otherParticipant = await prisma.groupUser.findFirst({
        where: {
          userId: { not: userId },
          groupId: message.groupId,
        
        },
        select: {
          groupId: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
  });


        return {
          groupId: message.groupId,
          message: message.message,
          groupType: message.group?.groupType,
          groupName: otherParticipant?.user.name || "Unknown",
          groupImage: otherParticipant?.user.avatar || "",
        };
      }
    })
  console.log("messages", messages)
   return Promise.all(messages).then(results => results.filter(result => result !== undefined));
      
 
  }; 

export const userService = {
  getUsersIntoDB,
  getSingleUserIntoDB,
  updateUserIntoDB,
  deleteUserIntoDB,
  blockUser,
  searchUser,
  getContacts,
  searchMessageFromDB
};
