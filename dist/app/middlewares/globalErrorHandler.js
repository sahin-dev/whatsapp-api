"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const GlobalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let success = false;
    let message = err.message || "Something went wrong!";
    let error = err;
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        message = 'Validation Error';
        error = err.message;
    }
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            message = "Duplicate Key error";
            error = err.meta;
        }
    }
    res.status(statusCode).json({
        success,
        message,
        error
    });
};
exports.default = GlobalErrorHandler;
