import { Request, Response } from "express";
import mongoose from "mongoose";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { PropertyService } from "../services/property.service";

const propertyService = new PropertyService();

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}

export class PropertyController {
  async getProperties(req: Request, res: Response) {
    try {
      const { page, limit, search, category, sortBy, sortOrder }: QueryParams =
        req.query;

      const { data, pagination } =
        await propertyService.getAvailablePropertiesPaginated({
          page,
          limit,
          search,
          category,
          sortBy,
          sortOrder,
        });

      return ApiResponseHelper.success(
        res,
        data,
        "Properties retrieved successfully",
        200,
        pagination,
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getPropertyById(req: Request, res: Response) {
    try {
      const propertyId = req.params.id as string;
      if (!propertyId) {
        return ApiResponseHelper.error(res, "Property ID is required", 400);
      }

      if (!mongoose.isValidObjectId(propertyId)) {
        return ApiResponseHelper.error(res, "Invalid property ID", 400);
      }

      const property = await propertyService.getAvailablePropertyById(
        propertyId,
      );

      return ApiResponseHelper.success(
        res,
        property,
        "Property retrieved successfully",
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
