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

import httpStatus from "http-status";
import { generateOtp } from "../../../helpers/generateOtp";
import { sendMessage } from "../../../helpers/sendMessage";

dotenv.config({ path: path.join(process.cwd(), ".env") });


const loginUserIntoDB = async (payload: any) => {

  let accessToken;
  let userInfo;
  

  const user = await prisma.user.findUnique({
    where: {
      phone: payload.phone,
    },
  });



  if (!user) {
    const otp = generateOtp()
    const otpExpiresIn = new Date(Date.now() + 10 *60*1000)
    const createUser = await prisma.user.create({
      data: {
        phone:payload.phone,
        otp,
        otpExpiresIn
      },
    });

    // accessToken = jwtHelpers.generateToken(
    //   {
    //     id: createUser.id,
    //     phone: createUser.phone,
    //     fcmToken: createUser?.fcmToken,
    //     subscription: createUser?.subcription,
    //   },
    //   config.jwt.jwt_secret as string,
    //   config.jwt.expires_in as string
    // );

    // const {status, createdAt, updatedAt, ...others } = createUser;
    // userInfo = others;
    const messageBody = `Your login verification code is ${otp}. Your otp will expires in 10 minutes`
    // await sendMessage(messageBody, createUser.phone)
    return {message:messageBody}
  }
  if (!payload.otp){
    const otp = generateOtp()
    const otpExpiresIn = new Date(Date.now() + 10 *60*1000)
    const messageBody = `Your login verification code is ${otp}. Your otp will expires in 10 minutes`
    await prisma.user.update({where:{id:user.id}, data:{otp, otpExpiresIn}})
    // await sendMessage(messageBody, user.phone)
    return {message:messageBody}
  }
    

  if (user.otp !== payload.otp || (!user.otpExpiresIn  && user.otpExpiresIn! < new Date(Date.now()))){
    throw new ApiError(httpStatus.BAD_REQUEST, "Otp invalid")
  }

  await prisma.user.update({where:{id:user.id}, data:{otp:null, otpExpiresIn:null}})

    accessToken = jwtHelpers.generateToken(
      {
        id: user?.id,
        phone: user?.phone,
        fcmToken: payload.fcmToken,
        subscription: user?.subcription,
      },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    const updateUserInfo = await prisma.user.update({
      where: {
        phone: payload.phone,
      },
      data: {
        fcmToken: payload.fcmToken,
        accessToken: accessToken,
      },
    });

    const {
      status,
      createdAt,
      updatedAt,
      accessToken: token,
      ...others
    } = updateUserInfo;
    userInfo = others;
  

  return {
    accessToken,
    userInfo,
  };
};

const logoutUser = async (userId:string)=>{
  const user = await prisma.user.findUnique({where:{id:userId}})

  if (!user){
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  await prisma.user.update ({where:{id:userId}, data:{accessToken:null}})

  return {message:"User logged out successfully"}
}

// get profile for logged in user
const getProfileFromDB = async (userId: string) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { groupUser: true },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { createdAt, updatedAt, ...sanitizedUser } = user;

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
  //check email uniquesness
  if (userData.email){
    const existingUser = await prisma.user.findFirst({where:{email:userData.email}})
    if (existingUser){
      throw new ApiError(httpStatus.CONFLICT, "User already exist with this email",userData.email)
    }
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: userData.username || user.name,
      email:userData.email || user.email
    },
  });

  const {  ...sanitizedUser } = updatedUser;

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
  const existingUser = await prisma.user.findFirst({
    where: { name: payload.username },
    include: { subscription: true },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (existingUser.role !== "USER") {
    const accessToken = jwtHelpers.generateToken(
      {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        fcmToken: existingUser?.fcmToken,
        subscription: existingUser.subcription,
      },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    const updatedUser = await prisma.user.update({
      where: { phone: existingUser.phone },
      data: {
        fcmToken: payload.fcmToken ? payload.fcmToken : existingUser?.fcmToken,
        accessToken: accessToken,
      },
    });

    const { ...userInfo } = updatedUser;

    return {
      accessToken,
      userInfo,
    };
  }

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

  if (existingUser.subscription.length === 0) {
    throw new ApiError(401, "need subscripion to min a plan");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      fcmToken: existingUser?.fcmToken,
      subscription: existingUser.subcription,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  const updatedUser = await prisma.user.update({
    where: { phone: user.phone },
    data: {
      fcmToken: payload.fcmToken ? payload.fcmToken : existingUser?.fcmToken,
      accessToken: accessToken,
    },
  });

  const {  ...userInfo } = updatedUser;

  return {
    accessToken,
    userInfo,
  };
};

const adminLoginAuth = async (payload: {
  username: string;
  password: string;
}) => {
  // const response = await axios.post(
  //   `${process.env.AUTH0_DOMAIN}/oauth/token`,
  //   {
  //     grant_type: "password",
  //     username: payload.username,
  //     password: payload.password,
  //     audience: process.env.AUTH0_AUDIENCE,
  //     client_id: process.env.AUTH0_CLIENT_ID,
  //     client_secret: process.env.AUTH0_CLIENT_SECRET,
  //     connection: "Username-Password-Authentication",
  //     scope: "openid profile email",
  //   },
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   }
  // );
  // const token = response.data.access_token;

  // verifyToken(token);
  // const user = await fetchUserProfile(token);

  const existingUser = await prisma.user.findFirst({
    where: { name: payload.username },
  });

  if (!existingUser) {
    throw new ApiError(404, "Admin user not found");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    existingUser.email as string
  );
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (existingUser?.role !== "ADMIN" && existingUser?.role !== "SUPER_ADMIN") {
    throw new ApiError(401, "You are not allowed to access this");
  }

  const authToken = jwtHelpers.generateToken(
    {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      fcmToken: existingUser?.fcmToken,
      subscription: existingUser.subcription,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  const updatedUser = await prisma.user.update({
    where: { phone: existingUser.phone },
    data: {
      accessToken: authToken,
    },
  });

  const { accessToken, ...userInfo } = updatedUser;

  return {
    accessToken: authToken,
    userInfo,
  };
};

const updateProfileImageInDB = async (req: any) => {
  const userId = req.user.id;
  const file = req.file;

  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found for edit user");
  }


  // Update user's avatar with the new filename
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      avatar: `${config.backend_base_url}/uploads/${file.filename}`,
    },
  });

  return updatedUser.avatar;
};

export const authService = {
  loginUserIntoDB,
  getProfileFromDB,
  updateProfileIntoDB,
  loginAuthProvider,
  adminLoginAuth,
  updateProfileImageInDB,
  logoutUser
};
