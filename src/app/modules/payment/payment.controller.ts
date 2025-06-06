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

const createSubcription = catchAsync(async (req: any, res: Response) => {
  const result = await paymentSevices.createSubcriptionInStripe(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment successfull",
    data: result,
  });
});

const cancelSubcription = catchAsync(async (req: any, res: Response) => {
  const subscriptionId = req.body.subscriptionId;

  await paymentSevices.cancelSubscriptionInStripe(subscriptionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "cancel subscription successfully",
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

const handleSubscription = catchAsync(async (req: Request, res: Response) => {
  const { userEmail } = req.body;
  const result = await paymentSevices.handleSubscriptionInAuth(userEmail);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "done",
    data: result,
  });
});

export const paymentControllers = {
  stripePortalSession,
  createSubcription,
  handelPaymentWebhook,
  cancelSubcription,
  handleSubscription,
};
