import express from "express";
import { SessionController } from "./session.controller";

const router = express.Router();

//login user
router.get("/:token", SessionController.checkSession);

export const sessionRoute = router;
