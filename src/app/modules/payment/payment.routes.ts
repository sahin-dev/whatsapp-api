import express from "express";
import { paymentControllers } from "./payment.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/create-portal-session", paymentControllers.stripePortalSession);
router.post(
  "/create-subscription",
  auth(),
  paymentControllers.createSubcription
);
router.post("/cancel-subscription", paymentControllers.cancelSubcription);
router.post("/login-with-auth", paymentControllers.loginWithAuthZero);

export const paymentRoute = router;
