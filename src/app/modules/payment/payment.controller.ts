import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { paymentSevices } from "./payment.service";
import sendResponse from "../../../shared/sendResponse";

const stripePortalSession = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.body.customerId;

  const result = await paymentSevices.stripePortalSessionInStripe(customerId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "return url successfully",
    data: result,
  });
});

export const paymentControllers = {
  stripePortalSession,
};
