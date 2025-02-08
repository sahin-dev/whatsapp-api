"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
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
exports.default = prisma;
