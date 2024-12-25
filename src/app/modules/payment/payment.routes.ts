import express from "express";
import { paymentControllers } from "./payment.controller";

const router = express.Router();

router.post("/create-portal-session", paymentControllers.stripePortalSession);
router.post("/login-with-auth", paymentControllers.loginWithAuthZero);

export const paymentRoute = router;
