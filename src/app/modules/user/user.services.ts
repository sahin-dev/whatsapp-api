import { PrismaClient, User } from "@prisma/client";
import ApiError from "../../errors/ApiErrors";
const prisma = new PrismaClient();
import { ObjectId } from "mongodb";
import { Request } from "express";
import { searchFilter } from "../../../shared/searchFilter";

//get single user
const getSingleUserIntoDB = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const {  ...sanitizedUser } = user;
  return sanitizedUser;
};

//get all users
const getUsersIntoDB = async (req: Request) => {
  const { search } = req.query as any;
  const searchFilters = search ? searchFilter(search) : {};
  const users = await prisma.user.findMany({
    where: searchFilters,
  });
  const sanitizedUsers = users.map((user) => {
    const {  accessToken, ...sanitizedUser } = user;
    return sanitizedUser;
  });
  return sanitizedUsers;
};

//update user
const updateUserIntoDB = async (id: string, userData: any) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const existingUser = await getSingleUserIntoDB(id);
  if (!existingUser) {
    throw new ApiError(404, "user not found for edit user");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: userData,
  });


  return updatedUser;
};

//delete user
const deleteUserIntoDB = async (userId: string) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  // if (userId === loggedId) {
  //   throw new ApiError(403, "You can't delete your own account!");
  // }
  const existingUser = await getSingleUserIntoDB(userId);
  if (!existingUser) {
    throw new ApiError(404, "user not found for delete this");
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  return;
};

export const userService = {
  getUsersIntoDB,
  getSingleUserIntoDB,
  updateUserIntoDB,
  deleteUserIntoDB,
};
