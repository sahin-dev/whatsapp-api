"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_route_1 = require("../modules/user/user.route");
const auth_routes_1 = require("../modules/auth/auth.routes");
const group_routes_1 = require("../modules/group/group.routes");
const chanel_routes_1 = require("../modules/chanel/chanel.routes");
const message_routes_1 = require("../modules/message/message.routes");
const notification_route_1 = require("../modules/notifications/notification.route");
const home_routes_1 = require("../modules/home/home.routes");
const session_route_1 = require("../modules/session/session.route");
const payment_routes_1 = require("../modules/payment/payment.routes");
const auth_zero_routes_1 = require("../modules/auth-zero/auth-zero.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/users",
        route: user_route_1.userRoutes,
    },
    {
        path: "/auth",
        route: auth_routes_1.authRoute,
    },
    {
        path: "/group",
        route: group_routes_1.groupRoutes,
    },
    {
        path: "/channel",
        route: chanel_routes_1.chanelRoutes,
    },
    {
        path: "/message",
        route: message_routes_1.messageRoute,
    },
    {
        path: "/notification",
        route: notification_route_1.notificationsRoute,
    },
    {
        path: "/home-content",
        route: home_routes_1.homeContentRoute,
    },
    {
        path: "/session",
        route: session_route_1.sessionRoute,
    },
    {
        path: "/payment",
        route: payment_routes_1.paymentRoute,
    },
    {
        path: "/auth-zero",
        route: auth_zero_routes_1.authZeroRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
