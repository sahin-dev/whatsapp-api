import prisma from "../../../shared/prisma";
import config from "../../../config";

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

export const messageService = {
  createMessageInDB,
  getMessagesFromDB,
  getSingleMessageFromDB,
};
