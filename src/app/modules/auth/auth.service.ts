import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { IProfileUpdate } from "./auth.interface";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import path from "path";
import axios from "axios";
import jwt from "jsonwebtoken";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const loginUserIntoDB = async (payload: any) => {
  let accessToken;
  let userInfo;
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    const createUser = await prisma.user.create({
      data: {
        ...payload,
        fcmToken: payload.fcmToken,
        password: await bcrypt.hash(payload.password, 10),
      },
    });

    accessToken = jwtHelpers.generateToken(
      {
        id: createUser.id,
        email: createUser.email,
        role: createUser.role,
        fcmToken: createUser.fcmToken,
        subscription: createUser.subcription,
      },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    const { password, status, createdAt, updatedAt, ...others } = createUser;
    userInfo = others;
  } else {
    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password as string
    );
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    accessToken = jwtHelpers.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fcmToken: payload.fcmToken,
        subscription: user.subcription,
      },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );
    const updateUserInfo = await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcmToken,
        accessToken: accessToken,
      },
    });

    const {
      password,
      status,
      createdAt,
      updatedAt,
      accessToken: token,
      ...others
    } = updateUserInfo;
    userInfo = others;
  }

  return {
    accessToken,
    userInfo,
  };
};

// get profile for logged in user
const getProfileFromDB = async (userId: string) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { group: true },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { password, createdAt, updatedAt, ...sanitizedUser } = user;

  return sanitizedUser;
};

// update user profile only logged in user
const updateProfileIntoDB = async (
  userId: string,
  userData: IProfileUpdate
) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "user not found for edit user");
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username: userData.username,
    },
  });

  const { password, ...sanitizedUser } = updatedUser;

  return sanitizedUser;
};

const verifyToken = (token: string) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error: any) {
    console.error("❌ Token Verification Failed:", error.message);
    throw error;
  }
};

// Step 3: Fetch User Profile
const fetchUserProfile = async (token: string) => {
  const response = await axios.get(`${process.env.AUTH0_DOMAIN}/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.data) {
    throw new ApiError(404, "User not found");
  }

  return response.data;
};

const loginAuthProvider = async (payload: {
  username: string;
  password: string;
  fcmToken?: string;
}) => {
  try {
    const response = await axios.post(
      `${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        grant_type: "password",
        username: payload.username,
        password: payload.password,
        audience: process.env.AUTH0_AUDIENCE,
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        connection: "Username-Password-Authentication",
        scope: "openid profile email",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const token = response.data.access_token;

    verifyToken(token);
    const user = await fetchUserProfile(token);

    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: {
        password: bcrypt.hashSync(payload.password, 10),
        fcmToken: payload.fcmToken ? payload.fcmToken : existingUser?.fcmToken,
      },
    });

    const accessToken = jwtHelpers.generateToken(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        fcmToken: updatedUser?.fcmToken,
        subscription: updatedUser.subcription,
      },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    const { password, ...userInfo } = updatedUser;

    return {
      accessToken,
      userInfo,
    };
  } catch (error: any) {
    console.error(
      "❌ Login Failed:",
      error.response ? error.response.data : error.message
    );
    throw new ApiError(401, "Invalid credentials");
  }
};

export const authService = {
  loginUserIntoDB,
  getProfileFromDB,
  updateProfileIntoDB,
  loginAuthProvider,
};
