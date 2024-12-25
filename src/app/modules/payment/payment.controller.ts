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

const loginWithAuthZero = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.body.userEmail;

  const result = await paymentSevices.loginwithAuth(userEmail);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "return url successfully",
    data: result,
  });
});

const handelPaymentWebhook = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentSevices.handelPaymentWebhook(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "done",
    data: result,
  });
});

export const paymentControllers = {
  stripePortalSession,
  loginWithAuthZero,
  handelPaymentWebhook,
};
