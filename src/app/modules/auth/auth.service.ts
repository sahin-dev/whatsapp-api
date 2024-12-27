import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { IProfileUpdate } from "./auth.interface";
import { ObjectId } from "mongodb";

//login user
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
      user.password
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

    const { password, status, createdAt, updatedAt, ...others } =
      updateUserInfo;
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

export const authService = {
  loginUserIntoDB,
  getProfileFromDB,
  updateProfileIntoDB,
};
