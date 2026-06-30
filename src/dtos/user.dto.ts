import { z } from "zod";
import { UserSchema } from "../types/user.type";

// Register DTO
export const CreateUserDTO = UserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  username: true,
  phoneNumber: true,
  gender: true,
  password: true,
});

export const CreateUserDTOAdmin = UserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  username: true,
  password: true,
  phoneNumber: true,
  gender: true
});
export type CreateUserDTOAdmin = z.infer<typeof CreateUserDTOAdmin>;

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

// Login DTO
export const LoginUserDTO = UserSchema.pick({
  email: true,
  password: true,
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const UpdateUserDTO = UserSchema.partial();
export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;

export const UpdatePasswordDTO = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Current password must be at least 6 characters long"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["confirmPassword"],
  });
export type UpdatePasswordDTO = z.infer<typeof UpdatePasswordDTO>;
