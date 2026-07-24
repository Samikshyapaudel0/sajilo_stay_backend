import { PropertyMongoRepository } from "../repositories/property.repository";
import {
  CreatePropertyDTO,
  UpdatePropertyDTO,
} from "../dtos/property.dto";
import { IProperty } from "../models/property.model";
import { HttpException } from "../exceptions/http-exception";

const propertyRepository = new PropertyMongoRepository();

export class PropertyService {
  async createProperty(
    propertyData: CreatePropertyDTO,
    hostId: string,
  ): Promise<IProperty> {
    const property = await propertyRepository.createProperty({
      title: propertyData.title,
      description: propertyData.description,
      location: propertyData.location,
      pricePerNight: propertyData.pricePerNight,
      category: propertyData.category,
      amenities: propertyData.amenities,
      images: propertyData.images,
      status: propertyData.status,
      hostId: hostId as any,
    });
    return property;
  }

  async updateProperty(
    id: string,
    propertyData: UpdatePropertyDTO,
  ): Promise<IProperty> {
    const existingProperty = await propertyRepository.getPropertyById(id);
    if (!existingProperty) {
      throw new HttpException(404, "Property not found");
    }
    const updatedProperty = await propertyRepository.update(id, propertyData as any);
    if (!updatedProperty) {
      throw new HttpException(500, "Failed to update property");
    }
    return updatedProperty;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const existingProperty = await propertyRepository.getPropertyById(id);
    if (!existingProperty) {
      throw new HttpException(404, "Property not found");
    }
    const deleted = await propertyRepository.delete(id);
    if (!deleted) {
      throw new HttpException(500, "Failed to delete property");
    }
    return deleted;
  }

  async getPropertyById(id: string): Promise<IProperty | null> {
    const property = await propertyRepository.getPropertyById(id);
    if (!property) {
      throw new HttpException(404, "Property not found");
    }
    return property;
  }

  async getAvailablePropertyById(id: string): Promise<IProperty | null> {
    const property = await propertyRepository.getPropertyById(id);
    if (!property) {
      throw new HttpException(404, "Property not found");
    }
    if (property.status !== "available") {
      throw new HttpException(404, "Property not available");
    }
    return property;
  }

  async getPropertiesByHost(hostId: string): Promise<IProperty[]> {
    const properties = await propertyRepository.getPropertiesByHost(hostId);
    return properties;
  }

  async getAllProperties(): Promise<IProperty[]> {
    const properties = await propertyRepository.getAll();
    return properties;
  }

  async getAllPropertyPaginated(page?: string, limit?: string, search?: string, category?: string, sortBy?: string) {
    const currentPage = page && parseInt(page) > 0 ? parseInt(page) : 1;
    const currentLimit = limit && parseInt(limit) > 0 ? parseInt(limit) : 10;
    const currentSearch = search && search.trim() !== "" ? search : undefined;
    const currentCategory = category && category.trim() !== "" ? category : undefined;
    const currentSortBy = sortBy && sortBy.trim() !== "" ? sortBy : undefined;

    const { data, total } = await propertyRepository.getAllPaginated(
      currentPage,
      currentLimit,
      currentSearch,
      currentCategory,
      currentSortBy,
    );
    const totalPages = Math.ceil(total / currentLimit);
    const pagination = {
      page: currentPage,
      limit: currentLimit,
      totalPages: totalPages,
      total: total,
    };
    return { data, pagination };
  }
}
