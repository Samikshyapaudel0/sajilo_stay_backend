import { z } from "zod";
import { ApiResponseHelper } from "../../utils/apihelper.util";
import { Request, Response } from "express";
import { PropertyService } from "../../services/property.service";

const propertyService = new PropertyService();

const UpdatePropertyStatusSchema = z.object({
  status: z.enum(["available", "booked", "maintenance"]),
});

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
}

export class AdminPropertyController {
  async getAllProperties(req: Request, res: Response) {
    try {
      const { page, limit, search }: QueryParams = req.query;
      const { data, pagination } = await propertyService.getAllPropertyPaginated(
        page,
        limit,
        search,
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

  async getPropertyById(req: Request, res: Response) {
    try {
      const propertyId = req.params.id as string;
      if (!propertyId) {
        return ApiResponseHelper.error(res, "Property ID is required", 400);
      }
      const property = await propertyService.getPropertyById(propertyId);
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

  async updatePropertyStatus(req: Request, res: Response) {
    try {
      const propertyId = req.params.id as string;
      if (!propertyId) {
        return ApiResponseHelper.error(res, "Property ID is required", 400);
      }

      const statusData = UpdatePropertyStatusSchema.safeParse(req.body);
      if (!statusData.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(statusData.error),
          400,
        );
      }

      const updatedProperty = await propertyService.updateProperty(
        propertyId,
        statusData.data,
      );
      return ApiResponseHelper.success(
        res,
        updatedProperty,
        "Property status updated successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      const propertyId = req.params.id as string;
      const deleted = await propertyService.deleteProperty(propertyId);
      if (!deleted) {
        return ApiResponseHelper.error(res, "Property not found", 404);
      }
      return ApiResponseHelper.success(res, null, "Property deleted successfully");
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }
}
