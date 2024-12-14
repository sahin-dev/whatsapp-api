import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";

const createHomeContentInDB = async (payload: any) => {
  const homeContent = await prisma.homeContent.create({
    data: payload,
  });
  return homeContent;
};

const getHomeContentFromDB = async () => {
  const homeContent = await prisma.homeContent.findMany();

  if (homeContent.length === 0) {
    throw new ApiError(404, "No home content");
  }
  return homeContent[0];
};

export const homeContentServices = {
  createHomeContentInDB,
  getHomeContentFromDB,
};
