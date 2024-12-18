import express from "express";
import { authZeroControllers } from "./auth-zero.controller";

const router = express.Router();

router.get("/logged-status", authZeroControllers.loggedStatus);

export const authZeroRoutes = router;
