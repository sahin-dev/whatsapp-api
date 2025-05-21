"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    phone: zod_1.z.string({ required_error: "Phone is required" }),
    fcmToken: zod_1.z.string().optional()
});
const updateProfileSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .optional(),
    email: zod_1.z
        .string().email()
        .min(2, "Last name must be at least 2 characters long")
        .optional(),
});
exports.authValidation = {
    updateProfileSchema,
    loginSchema
};
