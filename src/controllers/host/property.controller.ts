import { z } from "zod";
import { CreatePropertyDTO, UpdatePropertyDTO } from "../../dtos/property.dto";
import { ApiResponseHelper } from "../../utils/apihelper.util";
import { Request, Response } from "express";
import { PropertyService } from "../../services/property.service";
import { HttpException } from "../../exceptions/http-exception";

const propertyService = new PropertyService();

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
}

export class HostPropertyController {
  
 
  async createProperty(req: Request, res: Response) {
     console.log("BODY:", req.body);
     console.log("FILE:", req.file);
     console.log("USER:", req.user);
    try {
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }
      console.log("req.body =", req.body);
      console.log("req.files =", req.files);

      const propertyData = CreatePropertyDTO.safeParse(req.body);
      if (!propertyData.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(propertyData.error),
          400,
        );
      }

      const property = await propertyService.createProperty(
        propertyData.data,
        hostId.toString(),
      );
      return ApiResponseHelper.success(
        res,
        property,
        "Property created successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getProperties(req: Request, res: Response) {
    try {
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const properties = await propertyService.getPropertiesByHost(
        hostId.toString(),
      );
      return ApiResponseHelper.success(
        res,
        properties,
        "Properties retrieved successfully",
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
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const propertyId = req.params.id as string;
      if (!propertyId) {
        return ApiResponseHelper.error(res, "Property ID is required", 400);
      }

      const property = await propertyService.getPropertyById(propertyId);
      
      if (!property) {
        return ApiResponseHelper.error(res, "Property not found", 404);
      }

      if (property.hostId.toString() !== hostId.toString()) {
        throw new HttpException(403, "Forbidden - Property does not belong to this host");
      }

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

  async updateProperty(req: Request, res: Response) {
    try {
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const propertyId = req.params.id as string;
      const propertyData = UpdatePropertyDTO.safeParse(req.body);

      if (!propertyData.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(propertyData.error),
          400,
        );
      }

      const existingProperty = await propertyService.getPropertyById(propertyId);
      if (!existingProperty) {
        return ApiResponseHelper.error(res, "Property not found", 404);
      }

      if (existingProperty.hostId.toString() !== hostId.toString()) {
        throw new HttpException(403, "Forbidden - Property does not belong to this host");
      }

      const updatedProperty = await propertyService.updateProperty(
        propertyId,
        propertyData.data,
      );
      return ApiResponseHelper.success(
        res,
        updatedProperty,
        "Property updated successfully",
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
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const propertyId = req.params.id as string;
      const existingProperty = await propertyService.getPropertyById(propertyId);
      
      if (!existingProperty) {
        return ApiResponseHelper.error(res, "Property not found", 404);
      }

      if (existingProperty.hostId.toString() !== hostId.toString()) {
        throw new HttpException(403, "Forbidden - Property does not belong to this host");
      }

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
