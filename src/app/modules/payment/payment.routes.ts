import express from "express";
import { paymentControllers } from "./payment.controller";

const router = express.Router();

router.post("/create-portal-session", paymentControllers.stripePortalSession);
router.post("/create-subscription", paymentControllers.createSubcription);
router.post("/cancel-subscription", paymentControllers.cancelSubcription);
router.post("/login-with-auth", paymentControllers.loginWithAuthZero);

export const paymentRoute = router;
