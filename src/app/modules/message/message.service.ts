import prisma from "../../../shared/prisma";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";

const createMessageInDB = async (req: any) => {
  const files = req.files;
  const uploadFiles = files?.sendFiles || [];
  const payload = req.body;
  const senderId = req.user.id;
  const chanelId = req.params.chanelId;

  const imageUrls = uploadFiles?.map((e: any) => {
    const result = e
      ? `${config.backend_base_url}/uploads/${e.filename}`
      : null;
    return result;
  });

  const newMessage = await prisma.message.create({
    data: {
      ...payload,
      senderId,
      channelId: chanelId,
      files: imageUrls,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return newMessage;
};

const getMessagesFromDB = async (channelId: string) => {
  const message = await prisma.message.findMany({
    where: {
      channelId: channelId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return message;
};

const deleteSingleMessageFromDB = async (messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new ApiError(404, "Message not found for delete");
  }
  await prisma.message.delete({
    where: { id: messageId },
  });

  return;
};

const getSingleMessageFromDB = async (messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return message;
};

const deleteAllMessagesFromChannel = async (channelId: string) => {
  const messages = await prisma.message.findMany({
    where: { channelId: channelId },
  });
  if (messages.length === 0) {
    throw new ApiError(404, "No messages found in this channel");
  }
  await prisma.message.deleteMany({ where: { channelId: channelId } });
  return;
};

const updateSingleMessageInDB = async (messageId: string, payload: any) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new ApiError(404, "Message not found for update");
  }
  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: payload,
  });
  return updatedMessage;
};

export const messageService = {
  createMessageInDB,
  getMessagesFromDB,
  getSingleMessageFromDB,
  deleteSingleMessageFromDB,
  deleteAllMessagesFromChannel,
  updateSingleMessageInDB,
};
