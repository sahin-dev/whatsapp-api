import { z } from "zod";

const userRegisterValidationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters long"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .optional(),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number at least 10 digit long").optional(),
  avatar: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

const userUpdateValidationSchema = z.object({
  name: z
    .string()
    .min(2, "name must be at least 2 characters long")
    .optional(),
  about: z
    .string()
    .min(2, "about must be at least 2 characters long")
    .optional(),

});

export const userValidation = {
  userRegisterValidationSchema,
  userUpdateValidationSchema,
};
