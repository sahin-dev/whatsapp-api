import prisma from "../../../shared/prisma";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import axios from "axios";

const appID = config.agora.app_id as string;
const appCertificate = config.agora.app_certificate as string;

//using for socket in controllers
const createMessageInDB = async (req: any) => {
  const files = req.files;
  const uploadFiles = files?.sendFiles || [];
  const payload = req.body;
  const senderId = req.user.id;
  const chanelId = req.params.chanelId;

  if (payload?.message === undefined && files === undefined) {
    throw new ApiError(400, "Message or file is required");
  }

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

//using for socket
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

const searchMessageFromDB = async (channelId: string, search: string) => {
  if (search === undefined) {
    return [];
  }

  const existingChannel = await prisma.channel.findUnique({
    where: { id: channelId },
  });
  if (!existingChannel) {
    throw new ApiError(404, "Channel not found");
  }

  const messages = await prisma.message.findMany({
    where: {
      channelId: channelId,
      message: {
        contains: search,
        mode: "insensitive",
      },
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

  return messages;
};

//using for socket
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

//using for socket
const deleteMultipleMessagesFromDB = async (ids: string[]) => {
  await prisma.message.deleteMany({ where: { id: { in: ids } } });
  return;
};

const updateSingleMessageInDB = async (
  messageId: string,
  updateText: string
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new ApiError(404, "Message not found for update");
  }
  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      message: updateText,
    },
  });
  return updatedMessage;
};

//using for socket
const pinUnpinMessage = async (messageId: string, isPinned: boolean) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new ApiError(404, "Message not found for pin/unpin");
  }
  const result = await prisma.message.update({
    where: { id: messageId },
    data: { isPinned },
  });
  return result;
};

const pinnedMessageInDB = async (channelId: string) => {
  const pinnedMessages = await prisma.message.findMany({
    where: { isPinned: true, channelId: channelId },
    orderBy: { updatedAt: "desc" },
  });

  // if (pinnedMessages.length === 0) {
  //   return null;
  // }

  return pinnedMessages;
};

// generate agora access token
const generateAccessTokenInAgora = async (payload: {
  role: string;
  roomId: string;
  uid: number;
}) => {
  const channelName = payload.roomId;
  const uid = payload.uid;
  const expiredTimeInSeconds = 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expiredTimeInSeconds;
  const role = payload.role;
  // console.log(role)
  // console.log(role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER);

  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
    privilegeExpireTime
  );

  return token;
};

const getResourceId = async (roomId: string, uid: number) => {
  console.log(roomId)
  const url = `https://api.agora.io/v1/apps/${appID}/cloud_recording/acquire`;
  const payload = {
    cname: roomId,
    uid: uid.toString(),
    clientRequest: {},
  };

  try {

    console.log(`Basic ${Buffer.from(`${appID}:${appCertificate}`).toString("base64")}`)
    console.log("Hi")
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${appID}:${appCertificate}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });
    
   
    console.log("Response:", response.data);
    return response.data.resourceId;
  } catch (error: any) {
    console.error(
      "Error fetching Resource ID:",
      error.response?.data || error.message
    );
    throw new Error(`Failed to fetch Resource ID: ${error.message}`);
  }
};

// const generateToken = (roomId: string, uid: number) => {
//   const expirationTimeInSeconds = 3600; // 1 hour

//   const currentTimestamp = Math.floor(Date.now() / 1000);
//   const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

//   const token = RtcTokenBuilder.buildTokenWithUid(
//     appID,
//     appCertificate,
//     roomId,
//     uid,
//     RtcRole.PUBLISHER,
//     privilegeExpiredTs
//   );

//   return token;
// };

const startRecordingInAgora = async (roomId: string, uid: number) => {
  const resourceId = await getResourceId(roomId, uid);
  
  // const token = generateToken(roomId, uid);
  const url = `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;

  const payload = {
    cname: roomId,
    uid: uid.toString(),
    clientRequest: {
      recordingConfig: {
        maxIdleTime: 30,
        streamTypes: 2,
        channelType: 1,
        videoStreamType: 1,
        transcodingConfig: {
          height: 1080,
          width: 1920,
          bitrate: 2260,
          fps: 15,
          mixedVideoLayout: 1,
          backgroundColor: "#000000",
        },
      },
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${appID}:${appCertificate}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Error starting recording:",
      error.response?.data || error.message
    );
    throw new Error("Failed to start recording");
  }
};

export const messageService = {
  createMessageInDB,
  getMessagesFromDB,
  getSingleMessageFromDB,
  deleteSingleMessageFromDB,
  deleteAllMessagesFromChannel,
  updateSingleMessageInDB,
  deleteMultipleMessagesFromDB,
  pinUnpinMessage,
  generateAccessTokenInAgora,
  pinnedMessageInDB,
  searchMessageFromDB,
  startRecordingInAgora,
};
