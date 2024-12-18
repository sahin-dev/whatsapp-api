import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const loggedStatus = catchAsync(async (req: Request, res: Response) => {
  const isLoggedIn = req.oidc?.isAuthenticated?.() || false;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: isLoggedIn ? "Logged in" : "Not logged in",
    data: {
      isLoggedIn,
    },
  });
});

export const authZeroControllers = {
  loggedStatus,
};
