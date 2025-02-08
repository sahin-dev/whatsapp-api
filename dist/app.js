"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const express_openid_connect_1 = require("express-openid-connect");
const autZero_1 = require("./config/autZero");
const payment_controller_1 = require("./app/modules/payment/payment.controller");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Middleware setup
prisma
    .$connect()
    .then(() => {
    console.log("Database connected successfully!");
})
    .catch((error) => {
    console.error("Failed to connect to the database:", error);
});
app.use("/webhook", express_1.default.raw({ type: "application/json" }), payment_controller_1.paymentControllers.handelPaymentWebhook);
app.use((0, express_openid_connect_1.auth)(autZero_1.authZeroConfig));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", "uploads")));
app.post("/api/handleSubscription", payment_controller_1.paymentControllers.handleSubscription);
// Route handler for root endpoint
app.get("/", (req, res) => {
    res.send({
        Message: "Welcome to api main route",
    });
});
app.get("/profile", (0, express_openid_connect_1.requiresAuth)(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});
// Router setup
app.use("/api/v1", routes_1.default);
// Global Error Handler
app.use(globalErrorHandler_1.default);
// API Not found handler
app.use((req, res, next) => {
    res.status(http_status_1.default.NOT_FOUND).json({
        success: false,
        message: "API NOT FOUND!",
        error: {
            path: req.originalUrl,
            message: "Your requested path is not found!",
        },
    });
});
exports.default = app;
