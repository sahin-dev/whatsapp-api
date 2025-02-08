"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .optional(),
    lastName: zod_1.z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .optional(),
    mobile: zod_1.z
        .string()
        .min(10, "Mobile must be at least 10 characters long")
        .optional(),
});
exports.authValidation = {
    updateProfileSchema,
};
