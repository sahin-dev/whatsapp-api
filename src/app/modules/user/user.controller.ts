import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import httpStatus from "http-status";

//get users
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getUsersIntoDB(req);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "users retrived successfully",
    data: users,
  });
});

//get single user
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getSingleUserIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrived successfully",
    data: user,
  });
});


//update user
const updateUser = catchAsync(async (req: any, res: Response) => {
  const user = req.user
  const updatedUser = await userService.updateUserIntoDB(
    user.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user updated successfully",
    data: updatedUser,
  });
});

//delete user
const deleteUser = catchAsync(async (req: any, res: Response) => {
  // const userId = req.params.id;
  const userId = req.user.id;
  await userService.deleteUserIntoDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user deleted successfully",
  });
});

const blockUser = catchAsync(async (req:any, res:Response) => {
  const userId = req.user.id
  const {otherUserId} = req.params

  await userService.blockUser(userId,otherUserId)

  sendResponse(res,{
    statusCode:httpStatus.OK,
    success:true,
    message:"User status changed"
  })
})

const searchUser = catchAsync(async (req:any, res:Response)=>{
  const {phone} = req.params
  const users = await userService.searchUser(phone)

  sendResponse(res, {
    statusCode:httpStatus.OK,
    success:true,
    message:"User fetched successfully",
    data:users
  })
})

export const UserControllers = {
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  blockUser,
  searchUser
};
