import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { auth, requiresAuth } from "express-openid-connect";
import { authZeroConfig } from "./config/autZero";
import { paymentControllers } from "./app/modules/payment/payment.controller";
import config from "./config";

const app: Application = express();
const prisma = new PrismaClient();

const APP_ID = config.agora.app_id;
// const APP_CERTIFICATE = config.agora.app_certificate;
const CUSTOMER_ID = "79d7925d2fa94b2e8625b9943d41a118";
const CUSTOMER_SECRET = "6ebfb0a5859f40daa25f75b361cc209b";
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

app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentControllers.handelPaymentWebhook
);

app.use(auth(authZeroConfig));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.post("/api/handleSubscription", paymentControllers.handleSubscription);

// Route handler for root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Welcome to api main route",
  });
});

app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

app.post("/api/v1/start-recording", async (req, res) => {
  const { channel, uid } = req.body;

  // Step 1: Acquire Resource ID
  const acquireRes = await fetch(
    `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/acquire`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${CUSTOMER_ID}:${CUSTOMER_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        cname: channel,
        uid: uid.toString(),
        clientRequest: {},
      }),
    }
  );
  const acquireData = await acquireRes.json();
  const resourceId = acquireData.resourceId;

  // Step 2: Start Recording
  const startRes = await fetch(
    `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${CUSTOMER_ID}:${CUSTOMER_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        resourceId,
        mode: "mix",
        cname: channel,
        uid: uid.toString(),
        clientRequest: {
          recordingConfig: {
            maxIdleTime: 30,
            streamTypes: 2,
            channelType: 0,
            videoStreamType: 0,
            transcodingConfig: {
              width: 1280,
              height: 720,
              fps: 30,
              bitrate: 1000,
              mixedVideoLayout: 1,
            },
          },
          storageConfig: {
            vendor: 1, // 1 = AWS S3, 2 = Google Cloud, 3 = AliCloud OSS
            region: "fra1",
            bucket: "dancefluencer",
            accessKey: "DO00JF7Q4QFL6JT626LQ",
            secretKey: "+8jgp74O4nG3wtgidZUWw4IARjkC1SghG39zGK65FTk",
            fileNamePrefix: ["recordings"],
          },
        },
      }),
    }
  );

  const startData = await startRes.json();
  res.json(startData);
});

// Router setup
app.use("/api/v1", router);

// Global Error Handler
app.use(GlobalErrorHandler);

// API Not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
