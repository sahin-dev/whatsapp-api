import { z } from "zod";


const loginSchema = z.object({
  phone:z.string({required_error:"Phone is required"}),
  fcmToken:z.string().optional()
})

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .optional(),
  mobile: z
    .string()
    .min(10, "Mobile must be at least 10 characters long")
    .optional(),
});

export const authValidation = {
  updateProfileSchema,
  loginSchema
};
