import { UserService } from "../../services/user.service";
import { z } from "zod";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO, UpdatePasswordDTO, CreateUserDTOAdmin } from "../../dtos/user.dto";
import { ApiResponseHelper } from "../../utils/apihelper.util";
import { Request, Response } from "express";
const userService = new UserService();

interface QueryParams {
    page?: string;
    limit?: string;
    search?: string;
}
export class AdminUserController {
    async createUser(req: Request, res: Response) {
        try {
            const userData = CreateUserDTOAdmin.safeParse(req.body);
            if (!userData.success) {
                return ApiResponseHelper
                    .error(res, z.prettifyError(userData.error), 400);
            }
            const user = await userService.createUser(userData.data);
            return ApiResponseHelper.success(res, user, "User created successfully");
        } catch (error: Error | any | unknown) {
            return ApiResponseHelper.error(
                res,
                error.message || "Internal Server Error",
                error.status || 500
            );
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;

            const userData = UpdateUserDTO.safeParse(req.body);

            if (!userData.success) {
                return ApiResponseHelper
                    .error(res, z.prettifyError(userData.error), 400);
            }

            if (req.file) {
                userData.data.imageUrl = "/uploads/" + req.file.filename; // add profileImage path to body
            }
            const updatedUser = await userService.updateUser(userId, userData.data);
            return ApiResponseHelper.success(res, updatedUser, "User updated successfully");
        } catch (error: Error | any | unknown) {
            return ApiResponseHelper.error(
                res,
                error.message || "Internal Server Error",
                error.status || 500
            );
        }
    }

    async updatePassword(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;

            const userData = UpdatePasswordDTO.safeParse(req.body);

            if (!userData.success) {
                return ApiResponseHelper
                    .error(res, z.prettifyError(userData.error), 400);
            }
            const checkPasswordValid = await userService.checkPassword(userId, userData.data.currentPassword);
            if (!checkPasswordValid) {
                return ApiResponseHelper.error(res, "Current password is incorrect", 400);
            }

            const password = userData.data.newPassword;
            // can use the same service function for updating user, since it can update any field, just pass the new password in the data
            const updatedUser = await userService.updateUser(userId, { password });

            return ApiResponseHelper.success(res, updatedUser, "Password updated successfully");
        } catch (error: Error | any | unknown) {
            return ApiResponseHelper.error(
                res,
                error.message || "Internal Server Error",
                error.status || 500
            );
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;
            const deleted = await userService.deleteUser(userId);
            if (!deleted) {
                return ApiResponseHelper.error(res, "User not found", 404);
            }
            return ApiResponseHelper.success(res, null, "User deleted successfully");
        }
        catch (error: Error | any | unknown) {
            return ApiResponseHelper.error(
                res,
                error.message || "Internal Server Error",
                error.status || 500
            );
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;
            if (!userId) {
                return ApiResponseHelper.error(res, "User ID is required", 400);
            }
            const user = await userService.getUserById(userId);
            return ApiResponseHelper.success(res, user, "User retrieved successfully");
        } catch (error: Error | any | unknown) {
            return ApiResponseHelper.error(
                res,
                error.message || "Internal Server Error",
                error.status || 500
            );
        }
    }

    async getAllUserPaginated(req: Request, res: Response) {
        try {
            const { page, limit, search }: QueryParams = req.query;
            const { data, pagination } = await userService.getAllUserPaginated(page, limit, search);
            
            return ApiResponseHelper.success(res, data, "Users retrieved successfully", 200, pagination);
        } catch (error: Error | any | unknown) {
            return ApiResponseHelper.error(
                res,
                error.message || "Internal Server Error",
                error.status || 500
            );
        }
    }
}