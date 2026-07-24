import { Request, Response } from "express";
import { PropertyService } from "../services/property.service";
import { ApiResponseHelper } from "../utils/apihelper.util";

const propertyService = new PropertyService();

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  sortBy?: string;
}

export class PropertyController {
  async getAvailableProperties(req: Request, res: Response) {
    try {
      const { page, limit, search, category, sortBy }: QueryParams = req.query;
      const { data, pagination } = await propertyService.getAllPropertyPaginated(
        page,
        limit,
        search,
        category,
        sortBy,
      );
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

  async getAvailablePropertyById(req: Request, res: Response) {
    try {
      const propertyId = req.params.id as string;
      if (!propertyId) {
        return ApiResponseHelper.error(res, "Property ID is required", 400);
      }
      const property = await propertyService.getAvailablePropertyById(propertyId);
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
