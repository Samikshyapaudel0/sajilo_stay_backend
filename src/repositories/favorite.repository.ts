import { FavoriteModel, IFavorite } from "../models/favorite.model";

export interface IFavoriteRepository {
  createFavorite(favorite: Partial<IFavorite>): Promise<IFavorite>;
  getFavoriteById(id: string): Promise<IFavorite | null>;
  getFavoritesByUserId(userId: string): Promise<IFavorite[]>;
  getFavoriteByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<IFavorite | null>;
  deleteByUserAndProperty(userId: string, propertyId: string): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
}

export class FavoriteMongoRepository implements IFavoriteRepository {
  async createFavorite(favorite: Partial<IFavorite>): Promise<IFavorite> {
    const created = await FavoriteModel.create(favorite);
    return created;
  }

  async getFavoriteById(id: string): Promise<IFavorite | null> {
    const found = await FavoriteModel.findById(id).populate(
      "propertyId",
      "title location images pricePerNight category status hostId",
    );
    return found;
  }

  async getFavoritesByUserId(userId: string): Promise<IFavorite[]> {
    const found = await FavoriteModel.find({ userId })
      .populate(
        "propertyId",
        "title location images pricePerNight category status hostId",
      )
      .sort({ createdAt: -1 });
    return found;
  }

  async getFavoriteByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<IFavorite | null> {
    const found = await FavoriteModel.findOne({ userId, propertyId });
    return found;
  }

  async deleteByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<boolean> {
    const result = await FavoriteModel.deleteOne({ userId, propertyId });
    return result.deletedCount > 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await FavoriteModel.findByIdAndDelete(id);
    return !!result;
  }
}
