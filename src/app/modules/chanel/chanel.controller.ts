import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { chanelServices } from "./chanel.service";

// create a new chanel
const createChanel = catchAsync(async (req: Request, res: Response) => {
  const result = await chanelServices.createChanelInDB(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "New Chanel created successfully",
    data: result,
  });
});

// get all chanel
const getAllChanels = catchAsync(async (req: Request, res: Response) => {
  const chanels = await chanelServices.getChanelsInDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chanels retrieved",
    data: chanels,
  });
});

// get all channels for access user
const getAccessChannels = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;
  const channels = await chanelServices.getAccessChannelsFromDB(
    userId,
    groupId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "channels retrieved successfully",
    data: channels,
  });
});

// get single chanel
const getSingleChanel = catchAsync(async (req: Request, res: Response) => {
  const chanel = await chanelServices.getChanelInDB(req.params.chanelId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chanel retrived successfully",
    data: chanel,
  });
});

// update chanel
const updateChanel = catchAsync(async (req: Request, res: Response) => {
  const updatedChanel = await chanelServices.updateChanelInDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chanel updated successfully",
    data: updatedChanel,
  });
});

// delete chanel
const deleteChanel = catchAsync(async (req: Request, res: Response) => {
  const chanelId = req.params.chanelId;
  await chanelServices.deleteChanelInDB(chanelId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Chanel deleted successfully",
  });
});

// add members  in channel
const addMember = catchAsync(async (req: Request, res: Response) => {
  const channelId = req.params.channelId;
  const userId = req.body.userId;
  const result = await chanelServices.addMemberInChannel(channelId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "member added successfully",
    data: result,
  });
});

// get all members for a channel
const getAllMembersInchannel = catchAsync(
  async (req: Request, res: Response) => {
    const channelId = req.params.channelId;
    const members = await chanelServices.getMembersByChannelId(channelId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "members retrieved successfully",
      data: members,
    });
  }
);

// remove member from channel
const removeMember = catchAsync(async (req: Request, res: Response) => {
  const channelId = req.params.channelId;
  const userId = req.body.userId;
  const result = await chanelServices.removeMemberFromChannel(
    channelId,
    userId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "remove member successfully",
    data: result,
  });
});

// get all files from channel
const channelFiles = catchAsync(async (req: Request, res: Response) => {
  const channelId = req.params.channelId;
  const files = await chanelServices.channelFilesFromDB(channelId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "files retrived successfully",
    data: files,
  });
});

const recordingFiles = catchAsync(async (req, res) => {
  const channelId = req.params.channelId;
  const files = await chanelServices.recordingFilesFromDB(channelId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "recording files retrieved successfully",
    data: files,
  });
});

const singleRecordingFile = catchAsync(async (req, res) => {
  const { channelId, channelUid } = req.params;
  const recordInfo = await chanelServices.getRecordinLinkFromDB(
    channelId,
    channelUid
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "recording file retrieved successfully",
    data: recordInfo,
  });
});

export const chanelControllers = {
  createChanel,
  getAllChanels,
  getSingleChanel,
  updateChanel,
  deleteChanel,
  getAccessChannels,
  addMember,
  removeMember,
  getAllMembersInchannel,
  channelFiles,
  recordingFiles,
  singleRecordingFile,
};
