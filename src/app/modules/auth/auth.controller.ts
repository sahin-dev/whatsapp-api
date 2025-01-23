import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";

//login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const result = await authService.loginUserIntoDB(req.body);

  // res.cookie("accessToken", result.accessToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "none",
  //   maxAge: 24 * 60 * 60 * 1000,
  // });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

// get profile for logged in user
const getProfile = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const user = await authService.getProfileFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully",
    data: user,
  });
});

// update user profile only logged in user
const updateProfile = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const updatedUser = await authService.updateProfileIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile updated successfully",
    data: updatedUser,
  });
});

const loginWithAuth = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginAuthProvider(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.adminLoginAuth(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin successfully logged in",
    data: result,
  });
});

const updateProfileImage = catchAsync(async (req: Request, res: Response) => {
  await authService.updateProfileImageInDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile image updated successfully",
  });
});

export const authController = {
  loginUser,
  getProfile,
  updateProfile,
  loginWithAuth,
  adminLogin,
  updateProfileImage,
};
