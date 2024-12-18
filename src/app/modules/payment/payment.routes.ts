import express from "express";
import { paymentControllers } from "./payment.controller";

const router = express.Router();

router.post("/create-portal-session", paymentControllers.stripePortalSession);

export const paymentRoute = router;
