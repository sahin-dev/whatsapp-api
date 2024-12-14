import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SessionService } from "./session.service";

const checkSession = catchAsync(async (req: Request, res: Response) => {
  const token = req.params.token;
  const result = await SessionService.checkSession(token);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your session is valid",
    data: result,
  });
});
export const SessionController = {
  checkSession,
};
