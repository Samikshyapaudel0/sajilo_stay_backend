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

  async getPropertiesByHost(hostId: string): Promise<IProperty[]> {
    const properties = await propertyRepository.getPropertiesByHost(hostId);
    return properties;
  }

  async getAllProperties(): Promise<IProperty[]> {
    const properties = await propertyRepository.getAll();
    return properties;
  }

  async getAvailablePropertiesPaginated(query: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const currentPage =
      query.page && parseInt(query.page) > 0 ? parseInt(query.page) : 1;
    const currentLimit =
      query.limit && parseInt(query.limit) > 0 ? parseInt(query.limit) : 10;
    const currentSearch =
      query.search && query.search.trim() !== "" ? query.search.trim() : undefined;
    const currentCategory =
      query.category && query.category.trim() !== ""
        ? query.category.trim()
        : undefined;
    const sortOrder: "asc" | "desc" =
      query.sortOrder === "asc" ? "asc" : "desc";

    const { data, total } = await propertyRepository.getAvailablePaginated(
      currentPage,
      currentLimit,
      {
        search: currentSearch,
        category: currentCategory,
        sortBy: query.sortBy,
        sortOrder,
      },
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

  async getAvailablePropertyById(id: string): Promise<IProperty> {
    const property = await propertyRepository.getAvailablePropertyById(id);
    if (!property) {
      throw new HttpException(404, "Property not found");
    }
    return property;
  }

  async getAllPropertyPaginated(page?: string, limit?: string, search?: string) {
    const currentPage = page && parseInt(page) > 0 ? parseInt(page) : 1;
    const currentLimit = limit && parseInt(limit) > 0 ? parseInt(limit) : 10;
    const currentSearch = search && search.trim() !== "" ? search : undefined;

    const { data, total } = await propertyRepository.getAllPaginated(
      currentPage,
      currentLimit,
      currentSearch,
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
