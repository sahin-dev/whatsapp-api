import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { groupServices } from "./group.service";
import sendResponse from "../../../shared/sendResponse";

// create a new group
const createGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await groupServices.createGroupInDB(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "New group created successfully",
    data: result,
  });
});

// get all groups
const getAllGroups = catchAsync(async (req: Request, res: Response) => {
  const groups = await groupServices.getGroupsInDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Groups retrieved",
    data: groups,
  });
});

// get single group
const getSingleGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await groupServices.getGroupInDB(req.params.groupId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group retrived successfully",
    data: group,
  });
});

// update group
const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const updatedGroup = await groupServices.updateGroupInDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group updated successfully",
    data: updatedGroup,
  });
});

// delete group
const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  await groupServices.deleteGroupInDB(groupId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group deleted successfully",
  });
});

export const groupControllers = {
  createGroup,
  getAllGroups,
  getSingleGroup,
  updateGroup,
  deleteGroup,
};
