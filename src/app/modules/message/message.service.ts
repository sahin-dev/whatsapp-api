import prisma from "../../../shared/prisma";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import axios from "axios";
import httpStatus from "http-status";
import { fileUploader } from "../../../helpers/fileUploader";

const appID = config.agora.app_id as string;
const appCertificate = config.agora.app_certificate as string;

//using for socket in controllers
const createMessageInDB = async (req: any) => {
  const file = req.file;
  const payload = req.body;
  const senderId = req.user.id;
  const groupId = req.params.groupId;

  if (payload?.message === undefined && file === undefined) {
    throw new ApiError(400, "Message or file is required");
  }

  const imageUrls = (await fileUploader.uploadToDigitalOcean(file)).Location
  
  // await prisma.userMessage.create({data:{groupId,senderId,message:payload.message}})

  const newMessage = await prisma.userMessage.create({
    data: {
      ...payload,
      senderId,
      groupId,
      files: imageUrls,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
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
const getMessagesFromDB = async (groupId: string) => {
  const message = await prisma.userMessage.findMany({
    where: {
      groupId
    },
    include: {
      user: {
        select: {
          id: true,
      
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

const searchMessageFromDB = async (groupId: string, search: string) => {
  if (search === undefined) {
    return [];
  }

  const existingChannel = await prisma.group.findUnique({
    where: { id: groupId },
  });
  if (!existingChannel) {
    throw new ApiError(404, "Channel not found");
  }

  const messages = await prisma.userMessage.findMany({
    where: {
      groupId: groupId,
      message: {
        contains: search,
        mode: "insensitive",
      },
    },
    include: {
      user: {
        select: {
          id: true,
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
  const message = await prisma.userMessage.findUnique({
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
  const message = await prisma.userMessage.findUnique({
    where: { id: messageId },
    include: {
      user: {
        select: {
          id: true,
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

const deleteAllMessagesFromChannel = async (groupId: string) => {
  const messages = await prisma.userMessage.findMany({
    where: { groupId },
  });
  if (messages.length === 0) {
    throw new ApiError(404, "No messages found in this channel");
  }
  await prisma.userMessage.deleteMany({ where: { groupId } });
  return;
};

//using for socket
const deleteMultipleMessagesFromDB = async (ids: string[]) => {
  await prisma.userMessage.deleteMany({ where: { id: { in: ids } } });
  return;
};

const updateSingleMessageInDB = async (
  messageId: string,
  updateText: string
) => {
  const message = await prisma.userMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new ApiError(404, "Message not found for update");
  }
  const updatedMessage = await prisma.userMessage.update({
    where: { id: messageId },
    data: {
      message: updateText,
    },
  });
  return updatedMessage;
};

//using for socket
const pinUnpinMessage = async (messageId: string, isPinned: boolean) => {
  const message = await prisma.userMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new ApiError(404, "Message not found for pin/unpin");
  }
  const result = await prisma.userMessage.update({
    where: { id: messageId },
    data: { isPinned },
  });
  return result;
};

const pinnedMessageInDB = async (groupId: string) => {
  const pinnedMessages = await prisma.userMessage.findMany({
    where: { isPinned: true, groupId },
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

//new services



const sendMessage = async (req:any,senderId:string, groupId:string, message:string)=>{

   const files = req.files;
  const uploadFiles = files?.sendFiles || [];

  if (message === undefined && files === undefined) {
    throw new ApiError(400, "Message or file is required");
  }

  const fileUrls = uploadFiles?.map((e: any) => {
    const result = e
      ? `${config.backend_base_url}/uploads/${e.filename}`
      : null;
    return result;
  });

  const existingGroup = await prisma.user.findUnique({where:{id:senderId}})


  if(!existingGroup){
    throw new ApiError(httpStatus.NOT_FOUND, "Sender not found")
  }
  const userMessage = await prisma.userMessage.create({data:{senderId,groupId,message, files:fileUrls}})
  return userMessage
}


const getLastMessage = async (userId:string, groupId:string)=>{

  const message = await prisma.userMessage.findFirst({where:{senderId:userId,groupId}, orderBy:[{updatedAt:"asc"}]})
  if (!message){
    return {message:"no message"}
  }
  return message
}

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

//new
  sendMessage,
  getLastMessage
};
