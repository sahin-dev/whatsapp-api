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
import axios from "axios";

const app: Application = express();
const prisma = new PrismaClient();

const APP_ID = config.agora.app_id;
// const APP_CERTIFICATE = config.agora.app_certificate;
const CUSTOMER_ID = "fabfd743db384b048df89b750f27b317";
const CUSTOMER_SECRET = "eb6003c3216e46d1a1b237bfe84005aa";

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

const AUTH_HEADER = `Basic ${Buffer.from(
  `${CUSTOMER_ID}:${CUSTOMER_SECRET}`
).toString("base64")}`;

app.post("/api/v1/start-recording", async (req, res, next) => {
  try {
    const { channel, uid } = req.body;

    if (!channel || !uid) {
      return res.status(400).json({ error: "Missing channel or uid" });
    }

    // 1️⃣ **Acquire Resource ID**
    let resourceId;
    try {
      const acquireResponse = await axios.post(
        `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/acquire`,
        {
          cname: channel,
          uid: uid.toString(),
          clientRequest: {
            scene: 0,
            resourceExpiredHour: 24,
          },
        },
        {
          headers: { Authorization: AUTH_HEADER },
        }
      );
      resourceId = acquireResponse.data.resourceId;
      console.log("Recording started - Resource ID:", resourceId);
    } catch (acquireError) {
      return res.status(500).json({
        error: "Failed to acquire resource ID",
      });
    }

    // 2️⃣ **Start Recording**
    try {
      const startResponse = await axios.post(
        `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
        {
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
              avFileType: ["hls", "mp4"],
            },
            storageConfig: {
              vendor: 1,
              region: 1,
              bucket: "agoracloud",
              accessKey: "AKIAQXUIX57ZS2O5KE77",
              secretKey: "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",
              fileNamePrefix: ["directory1", "directory2"],
              ACL: "public-read",
            },
          },
        },
        {
          headers: { Authorization: AUTH_HEADER },
        }
      );

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
    } catch (startError) {
      return res.status(500).json({
        error: "Failed to start recording",
      });
    }
  } catch (error) {
    console.error("Error in start-recording:", error);
    next(error);
  }
});

app.post("/api/v1/check-recording-status", async (req, res) => {
  const { resourceId, sid } = req.body;

  // Step 1: Check Recording Status
  const statusRes = await fetch(
    `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/status`,
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
        sid,
      }),
    }
  );

  const statusData = await statusRes.json();
  res.json(statusData);
});

app.post("/api/v1/stop-recording", async (req, res, next) => {
  const { channel, uid, resourceId, sid } = req.body;

  if (!channel || !uid || !resourceId || !sid) {
    return res
      .status(400)
      .json({ error: "Missing channel, uid, resourceId, or sid" });
  }

  const stopResponse = await axios.post(
    `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
    {
      cname: channel,
      uid: uid.toString(),
      clientRequest: {},
    },
    {
      headers: { Authorization: AUTH_HEADER },
    }
  );

  console.log("Stop Response:", stopResponse.data);

  return res.json({
    message: "Recording stopped successfully",
    details: stopResponse.data,
  });

  // 2️⃣ Extract File URL from Agora's Response

  // const fileList = stopResponse.data.serverResponse.fileList;
  // if (!fileList || fileList.length === 0) {
  //   return res.status(400).json({ error: "No recorded file found." });
  // }

  // const recordedFile = JSON.parse(fileList)[0]; // Parse JSON string to get first file
  // const fileUrl = recordedFile.fileName; // Agora provides the recorded file URL

  // // 3️⃣ Return the Actual MP4 URL
  // return res.json({
  //   message: "Recording stopped successfully",
  //   fileUrl, // Agora Cloud Recording File URL
  // });
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
