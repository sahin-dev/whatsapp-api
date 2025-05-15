import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { messageService } from "./message.service";
import sendResponse from "../../../shared/sendResponse";
import { channelClients } from "../../../server";
import prisma from "../../../shared/prisma";
import { User } from "@prisma/client";

const createMessage = catchAsync(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  await messageService.createMessageInDB(req);

  // Send the single message only to clients connected to the specific channel
  // const result = await messageService.createMessageInDB(req);

  //send all the messages only to clients connected to the specific channel
  const results = await prisma.message.findMany({
    where: { channelId: channelId },
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

  const messagePayload = {
    type: "message",
    channelId: channelId,
    message: results,
  };

  // Send the message only to clients connected to the specific channel
  const channelClient = channelClients.get(channelId) || [];
  channelClient.forEach((client: any) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(messagePayload));
    }
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Message created successfully",
    data: results,
  });
});

const getSingleMessage = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const message = await messageService.getSingleMessageFromDB(messageId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "message retrived successfully",
    data: message,
  });
});

const deleteSingleMessage = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  await messageService.deleteSingleMessageFromDB(messageId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "message deleted successfully",
  });
});

const deleteAllMessages = catchAsync(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  await messageService.deleteAllMessagesFromChannel(channelId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All messages deleted successfully from the channel",
  });
});

const deleteMultipleMessages = catchAsync(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    await messageService.deleteMultipleMessagesFromDB(ids);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Multiple Message deleted successfully",
    });
  }
);

const updateMessage = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const result = await messageService.updateSingleMessageInDB(
    messageId,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Message updated successfully",
    data: result,
  });
});

const generateAccessToken = catchAsync(async (req, res) => {
  const accessToken = await messageService.generateAccessTokenInAgora(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token generate successfully",
    data: accessToken,
  });
});

const startRecording = catchAsync(async (req, res) => {
  const { channelId } = req.params;
  const uid = req.body.uid;
  const result = await messageService.startRecordingInAgora(channelId, uid);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recording Start",
    data: result,
  });
});

const pinUnpinMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const { isPinned } = req.body;
  const result = await messageService.pinUnpinMessage(messageId, isPinned);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Pinned message status updated successfully",
    data: result,
  });
});

const pinnedMessage = catchAsync(async (req, res) => {
  const { channelId } = req.params;
  const result = await messageService.pinnedMessageInDB(channelId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Retrive pinned message successfully",
    data: result,
  });
});

const searchMessages = catchAsync(async (req, res) => {
  const { search } = req.query;
  const { channelId } = req.params;
  const results = await messageService.searchMessageFromDB(
    channelId,
    search as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Search messages retrived successfully",
    data: results,
  });
});

//new controller


const sendMessage = catchAsync (async (req:any, res:Response)=>{
  const {groupId} = req.params
  const user = req.user
  const {message} = req.body
  const result = await messageService.sendMessage(req,user.id, groupId, message)

  sendResponse (res, {
    statusCode:200,
    success:true,
    message:"Message send successfully",
    data:result
  })

})

const getLastMessage = catchAsync(async (req:any, res:Response)=>{
  const {channelId} = req.params
  const user = req.user

  const result = await messageService.getLastMessage(user.id, channelId)

  sendResponse(res, {
    statusCode:200,
    success:true,
    message:"Last message fetched",
    data:result
  })

})

export const messageController = {
  //new
  sendMessage,
  getLastMessage,                                 



  createMessage,
  getSingleMessage,
  deleteSingleMessage,
  deleteAllMessages,
  updateMessage,
  deleteMultipleMessages,
  generateAccessToken,
  pinnedMessage,
  searchMessages,
  startRecording,
  pinUnpinMessage,
};
