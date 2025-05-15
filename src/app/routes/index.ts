import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { groupRoutes } from "../modules/group/group.routes";
import { chanelRoutes } from "../modules/chanel/chanel.routes";
import { messageRoute } from "../modules/message/message.routes";
import { notificationsRoute } from "../modules/notifications/notification.route";
import { homeContentRoute } from "../modules/home/home.routes";
import { sessionRoute } from "../modules/session/session.route";
import { paymentRoute } from "../modules/payment/payment.routes";
import { authZeroRoutes } from "../modules/auth-zero/auth-zero.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },

  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/group",
    route: groupRoutes,
  },
  {
    path: "/channel",
    route: chanelRoutes,
  },
  {
    path: "/message",
    route: messageRoute,
  },
  {
    path: "/notification",
    route: notificationsRoute,
  },
  {
    path: "/home-content",
    route: homeContentRoute,
  },
  {
    path: "/session",
    route: sessionRoute,
  },
  {
    path: "/payment",
    route: paymentRoute,
  },
  {
    path: "/auth-zero",
    route: authZeroRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
