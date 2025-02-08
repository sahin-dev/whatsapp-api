"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const config_1 = __importDefault(require("./config"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const APP_ID = config_1.default.agora.app_id;
// const APP_CERTIFICATE = config.agora.app_certificate;
const CUSTOMER_ID = "fabfd743db384b048df89b750f27b317";
const CUSTOMER_SECRET = "eb6003c3216e46d1a1b237bfe84005aa";
// const REGION = "CN"; // Change if needed
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
const AUTH_HEADER = `Basic ${Buffer.from(`${CUSTOMER_ID}:${CUSTOMER_SECRET}`).toString("base64")}`;
app.post("/api/v1/start-recording", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { channel, uid } = req.body;
        if (!channel || !uid) {
            return res.status(400).json({ error: "Missing channel or uid" });
        }
        // 1️⃣ **Acquire Resource ID**
        let resourceId;
        try {
            const acquireResponse = yield axios_1.default.post(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/acquire`, {
                cname: channel,
                uid: uid.toString(),
                clientRequest: {
                    scene: 0,
                    resourceExpiredHour: 24,
                },
            }, {
                headers: { Authorization: AUTH_HEADER },
            });
            resourceId = acquireResponse.data.resourceId;
            console.log("Recording started - Resource ID:", resourceId);
        }
        catch (acquireError) {
            return res.status(500).json({
                error: "Failed to acquire resource ID",
            });
        }
        // 2️⃣ **Start Recording**
        try {
            const startResponse = yield axios_1.default.post(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`, {
                uid: uid.toString(),
                cname: channel,
                clientRequest: {
                    recordingConfig: {
                        channelType: 1,
                        streamTypes: 2,
                        streamMode: "default",
                        videoStreamType: 0,
                        maxIdleTime: 30,
                        subscribeAudioUids: ["123", "456"],
                        subscribeVideoUids: ["123", "456"],
                        subscribeUidGroup: 0,
                    },
                    recordingFileConfig: {
                        avFileType: ["hls"],
                    },
                    storageConfig: {
                        vendor: 2,
                        region: 5,
                        bucket: "dancefluencer",
                        accessKey: "DO00JF7Q4QFL6JT626LQ",
                        secretKey: "8jgp74O4nG3wtgidZUWw4IARjkC1SghG39zGK65FTk",
                        fileNamePrefix: ["directory1", "directory2"],
                    },
                },
            }, {
                headers: { Authorization: AUTH_HEADER },
            });
            // storageConfig: {
            //         vendor: 1, // 1 = AWS S3, 2 = Google Cloud, 3 = AliCloud OSS
            //         region: 3, // Use Agora's region code (e.g., 2 for Europe)
            //         bucket: "dancefluencer",
            //         accessKey: "DO00JF7Q4QFL6JT626LQ",
            //         secretKey: "+8jgp74O4nG3wtgidZUWw4IARjkC1SghG39zGK65FTk",
            //         fileNamePrefix: ["recordings"],
            //       },
            return res.json({
                message: "Recording started successfully",
                resourceId,
                sid: startResponse.data.sid,
                details: startResponse.data,
            });
        }
        catch (startError) {
            return res.status(500).json({
                error: "Failed to start recording",
            });
        }
    }
    catch (error) {
        console.error("Error in start-recording:", error);
        next(error);
    }
}));
app.post("/api/v1/check-recording-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resourceId, sid } = req.body;
    // Step 1: Check Recording Status
    const statusRes = yield fetch(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${CUSTOMER_ID}:${CUSTOMER_SECRET}`).toString("base64")}`,
        },
        body: JSON.stringify({
            resourceId,
            sid,
        }),
    });
    const statusData = yield statusRes.json();
    res.json(statusData);
}));
// 🎯 **Stop Recording API**
app.post("/api/v1/stop-recording", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { channel, uid, resourceId, sid } = req.body;
        if (!channel || !uid || !resourceId || !sid) {
            return res
                .status(400)
                .json({ error: "Missing channel, uid, resourceId, or sid" });
        }
        const stopResponse = yield axios_1.default.post(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/web/stop`, {
            cname: channel,
            uid: uid.toString(),
            clientRequest: {},
        }, {
            headers: { Authorization: AUTH_HEADER },
        });
        return res.json({
            message: "Recording stopped successfully",
            details: stopResponse.data,
        });
    }
    catch (error) {
        console.error("Error in stop-recording:", error);
        next(error);
    }
}));
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
