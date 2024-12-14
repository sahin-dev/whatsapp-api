import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";

export const checkSession = async (token: string) => {
  const result = await prisma.user.findFirst({
    where: {
      accessToken: token,
    },
  });

  if (!result) {
    throw new ApiError(408, "You do not have access to this session");
  }
  return true;
};

export const SessionService = {
  checkSession,
};
