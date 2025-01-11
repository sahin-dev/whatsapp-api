import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "error",
    },
  ],
});

prisma.$on("error", (e) => {
  console.log(e);
});

export default prisma;