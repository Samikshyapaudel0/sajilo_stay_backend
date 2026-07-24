import { z } from "zod";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { Request, Response } from "express";
import { FavoriteService } from "../services/favorite.service";

const favoriteService = new FavoriteService();

const AddFavoriteDTO = z
  .object({
    propertyId: z.string().optional(),
    id: z.string().optional(),
  })
  .refine((data) => !!(data.propertyId || data.id), {
    message: "Property ID is required",
  })
  .transform((data) => ({
    propertyId: (data.propertyId || data.id)!,
  }));

export class FavoriteController {
  async addFavorite(req: Request, res: Response) {
    try {
      console.log("========== ADD FAVORITE REQUEST ==========");
      console.log("req.body:", req.body);
      console.log("req.user:", req.user);
      console.log("===========================================");

      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const favoriteData = AddFavoriteDTO.safeParse(req.body);
      if (!favoriteData.success) {
        console.log("Validation error:", favoriteData.error);
        return ApiResponseHelper.error(
          res,
          z.prettifyError(favoriteData.error),
          400,
        );
      }

      const favorite = await favoriteService.addFavorite(
        favoriteData.data.propertyId,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        favorite,
        "Property added to favorites",
        201,
      );
    } catch (error: Error | any | unknown) {
      console.error("========== ADD FAVORITE ERROR ==========");
      console.error(error);
      console.error(error.stack);
      console.error("========================================");
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getFavorites(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const favorites = await favoriteService.getFavoritesByUser(
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        favorites,
        "Favorites retrieved successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async removeFavorite(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const propertyId = req.params.propertyId as string;
      if (!propertyId) {
        return ApiResponseHelper.error(res, "Property ID is required", 400);
      }

      const result = await favoriteService.removeFavorite(
        propertyId,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        result,
        "Property removed from favorites",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }
}
