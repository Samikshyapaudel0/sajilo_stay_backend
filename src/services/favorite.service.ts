import { FavoriteMongoRepository } from "../repositories/favorite.repository";
import { PropertyMongoRepository } from "../repositories/property.repository";
import { IFavorite } from "../models/favorite.model";
import { HttpException } from "../exceptions/http-exception";

const favoriteRepository = new FavoriteMongoRepository();
const propertyRepository = new PropertyMongoRepository();

function formatFavoriteResponse(favorite: IFavorite) {
  const favoriteObj = favorite.toObject();
  const property = favoriteObj.propertyId as any;

  return {
    ...favoriteObj,
    propertyId: property?._id || favoriteObj.propertyId,
    property: property
      ? {
          _id: property._id,
          title: property.title,
          location: property.location,
          imageUrl: property.images?.[0] || null,
          pricePerNight: property.pricePerNight,
          category: property.category,
          status: property.status,
          hostId: property.hostId,
        }
      : null,
  };
}

export class FavoriteService {
  async addFavorite(propertyId: string, userId: string): Promise<IFavorite> {
    // Check if property exists
    const property = await propertyRepository.getPropertyById(propertyId);
    if (!property) {
      throw new HttpException(404, "Property not found");
    }

    // Check if already favorited
    const existingFavorite =
      await favoriteRepository.getFavoriteByUserAndProperty(userId, propertyId);
    if (existingFavorite) {
      throw new HttpException(400, "Property already favorited");
    }

    const favorite = await favoriteRepository.createFavorite({
      userId: userId as any,
      propertyId: propertyId as any,
    });

    const populatedFavorite = await favoriteRepository.getFavoriteById(
      favorite._id.toString(),
    );
    if (!populatedFavorite) {
      throw new HttpException(500, "Failed to create favorite");
    }
    return formatFavoriteResponse(populatedFavorite) as any;
  }

  async getFavoritesByUser(userId: string) {
    const favorites = await favoriteRepository.getFavoritesByUserId(userId);
    return favorites.map(formatFavoriteResponse);
  }

  async removeFavorite(propertyId: string, userId: string) {
    const favorite =
      await favoriteRepository.getFavoriteByUserAndProperty(userId, propertyId);
    if (!favorite) {
      throw new HttpException(404, "Favorite not found");
    }

    const deleted = await favoriteRepository.deleteByUserAndProperty(
      userId,
      propertyId,
    );
    if (!deleted) {
      throw new HttpException(500, "Failed to remove favorite");
    }

    return { message: "Favorite removed successfully" };
  }
}
