import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { homeContentController } from "./home.controller";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.SUPER_ADMIN),
  homeContentController.createHomeContent
);
router.get("/", homeContentController.getHomeContent);

export const homeContentRoute = router;
