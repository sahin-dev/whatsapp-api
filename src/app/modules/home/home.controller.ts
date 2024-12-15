import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { homeContentServices } from "./home.service";
import sendResponse from "../../../shared/sendResponse";

const createHomeContent = catchAsync(async (req: Request, res: Response) => {
  const result = await homeContentServices.createHomeContentInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Home content created successfully",
    data: result,
  });
});

const getHomeContent = catchAsync(async (req: Request, res: Response) => {
  const contentId = req.params.id;
  const homeContent = await homeContentServices.getHomeContentFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Home content retrived successfully",
    data: homeContent,
  });
});

export const homeContentController = {
  createHomeContent,
  getHomeContent,
};
