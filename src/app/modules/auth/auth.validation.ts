import { z } from "zod";


const loginSchema = z.object({
  phone:z.string({required_error:"Phone is required"}),
  fcmToken:z.string().optional(),
  otp:z.string().optional()
})

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .optional(),
  email: z
    .string().email()
    .min(2, "Last name must be at least 2 characters long")
    .optional(),
});

export const authValidation = {
  updateProfileSchema,
  loginSchema
};
