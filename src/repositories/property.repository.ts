import { PropertyModel, IProperty } from "../models/property.model";

export interface IPropertyRepository {
  createProperty(property: Partial<IProperty>): Promise<IProperty>;
  getPropertyById(id: string): Promise<IProperty | null>;
  getAll(): Promise<IProperty[]>;
  update(id: string, property: Partial<IProperty>): Promise<IProperty | null>;
  delete(id: string): Promise<boolean>;
  getPropertiesByHost(hostId: string): Promise<IProperty[]>;
  getAllPaginated(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    sortBy?: string,
  ): Promise<{ data: IProperty[]; total: number }>;
}

export class PropertyMongoRepository implements IPropertyRepository {
  async createProperty(property: Partial<IProperty>): Promise<IProperty> {
    const created = await PropertyModel.create(property);
    return created;
  }

  async getPropertyById(id: string): Promise<IProperty | null> {
    const found = await PropertyModel.findById(id);
    return found;
  }

  async getAll(): Promise<IProperty[]> {
    const found = await PropertyModel.find();
    return found;
  }

  async update(id: string, property: Partial<IProperty>): Promise<IProperty | null> {
    const updated = await PropertyModel.findByIdAndUpdate(id, property, { new: true });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await PropertyModel.findByIdAndDelete(id);
    return !!deleted;
  }

  async getPropertiesByHost(hostId: string): Promise<IProperty[]> {
    const found = await PropertyModel.find({ hostId });
    return found;
  }

  async getAllPaginated(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    sortBy?: string,
  ): Promise<{ data: IProperty[]; total: number }> {
    const query: any = { status: "available" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const total = await PropertyModel.countDocuments(query);

    let sortOptions: any = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case "price_asc":
          sortOptions = { pricePerNight: 1 };
          break;
        case "price_desc":
          sortOptions = { pricePerNight: -1 };
          break;
        case "newest":
          sortOptions = { createdAt: -1 };
          break;
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    const data = await PropertyModel.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total };
  }
}
