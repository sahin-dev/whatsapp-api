import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import config from "../../../config";
import { Request } from "express";

const createChanelInDB = async (req: any) => {
  const payload = req.body;
  const userId = req.user.id;
  const groupId = req.params.groupId;
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "No file attached");
  }
  const imageUrl = file
    ? `${config.backend_base_url}/uploads/${file.originalname}`
    : null;
  const existingGroup = await prisma.chanel.findFirst({
    where: { chanelName: payload.chanelName },
  });
  if (existingGroup) {
    throw new ApiError(409, "chanel with the same name already exists");
  }
  const newGroup = await prisma.chanel.create({
    data: {
      ...payload,
      userId,
      groupId,
      chanelImage: imageUrl ? imageUrl : "",
      memberIds: [userId],
    },
  });

  return newGroup;
};

const getChanelsInDB = async () => {
  const chanels = await prisma.chanel.findMany({
    include: { group: true },
    orderBy: { createdAt: "desc" },
  });
  if (chanels.length === 0) {
    throw new ApiError(404, "chanels not found ");
  }
  return chanels;
};

const getAccessChannelsFromDB = async (userId: string, groupId: string) => {
  const chanels = await prisma.chanel.findMany({
    include: {
      group: true,
      messages: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    where: {
      groupId: groupId,
      memberIds: {
        has: userId,
      },
    },
  });
  if (chanels.length === 0) {
    throw new ApiError(404, "chanels not found");
  }
  return chanels;
};

const getChanelInDB = async (chanelId: string) => {
  const group = await prisma.chanel.findUnique({
    where: { id: chanelId },
    include: { group: true },
  });
  if (!group) {
    throw new ApiError(404, "chanel not found");
  }
  return group;
};

const updateChanelInDB = async (req: Request) => {
  const payload = req.body;
  const chanelId = req.params.chanelId;
  const file = req.file;
  const imageUrl = file
    ? `${config.backend_base_url}/uploads/${file.originalname}`
    : null;
  const existingChanel = await prisma.chanel.findUnique({
    where: { id: chanelId },
  });
  if (!existingChanel) {
    throw new ApiError(404, "chanel not found for update");
  }
  const updatedChanel = await prisma.chanel.update({
    where: { id: chanelId },
    data: {
      ...payload,
      chanelImage: imageUrl ? imageUrl : existingChanel.chanelImage,
    },
  });
  return updatedChanel;
};

const deleteChanelInDB = async (chanelId: string) => {
  const existingChanel = await prisma.chanel.findUnique({
    where: { id: chanelId },
  });
  if (!existingChanel) {
    throw new ApiError(404, "Group not found for delete");
  }
  await prisma.chanel.delete({ where: { id: chanelId } });

  return;
};

const addMemberInChannel = async (channelId: string, userId: string) => {
  const isExisting = await prisma.chanel.findUnique({
    where: {
      id: channelId,
      memberIds: {
        has: userId,
      },
    },
  });
  if (isExisting) {
    throw new ApiError(409, "this user already exists");
  }

  const result = await prisma.chanel.update({
    where: { id: channelId },
    data: {
      memberIds: {
        push: userId,
      },
    },
  });

  return result;
};

const getMembersByChannelId = async (channelId: string) => {
  // Find the channel and retrieve its memberIds
  const channel = await prisma.chanel.findUnique({
    where: { id: channelId },
    select: { memberIds: true }, // Only select the member IDs
  });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Fetch all member information using the retrieved memberIds
  const members = await prisma.user.findMany({
    where: {
      id: { in: channel.memberIds }, // Use `in` to filter by multiple IDs
    },
  });

  return members;
};

const removeMemberFromChannel = async (channelId: string, userId: string) => {
  const isExisting = await prisma.chanel.findFirst({
    where: {
      id: channelId,
      memberIds: {
        has: userId,
      },
    },
  });
  if (!isExisting) {
    throw new ApiError(409, "user not existing");
  }

  const result = await prisma.chanel.update({
    where: { id: channelId },
    data: {
      memberIds: {
        set: isExisting.memberIds.filter((id) => id !== userId),
      },
    },
  });

  return result;
};

const channelFilesFromDB = async (channelId: string) => {
  const result = await prisma.message.findMany({
    where: { channelId: channelId },
  });

  if (result.length === 0) {
    throw new ApiError(404, "No files found in this channel");
  }

  const allFiles = result.flatMap((message) => message.files);

  return allFiles;
};

const recordingFilesFromDB = async (channelId: string) => {
  const result = await prisma.recording.findMany({
    where: { channelId: channelId },
    orderBy: { createdAt: "desc" },
    select: {
      recordingLink: true,
      createdAt: true,
    },
  });

  return result;
};

const getRecordinLinkFromDB = async (channelId: string, channelUid: string) => {
  const recordingLink = await prisma.recording.findFirst({
    where: { channelId, channelUid },
  });

  return recordingLink;
};

export const chanelServices = {
  createChanelInDB,
  getChanelsInDB,
  getChanelInDB,
  updateChanelInDB,
  deleteChanelInDB,
  addMemberInChannel,
  removeMemberFromChannel,
  getAccessChannelsFromDB,
  getMembersByChannelId,
  channelFilesFromDB,
  recordingFilesFromDB,
  getRecordinLinkFromDB,
};
