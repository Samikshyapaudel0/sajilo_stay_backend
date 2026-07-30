import { GeminiService } from "./gemini.service";
import { IntentDetectionService, IntentType } from "./intent-detection.service";
import { HttpException } from "../exceptions/http-exception";
import { PropertyMongoRepository } from "../repositories/property.repository";
import { BookingMongoRepository } from "../repositories/booking.repository";
import { FavoriteMongoRepository } from "../repositories/favorite.repository";

const geminiService = new GeminiService();
const intentDetectionService = new IntentDetectionService();
const propertyRepository = new PropertyMongoRepository();
const bookingRepository = new BookingMongoRepository();
const favoriteRepository = new FavoriteMongoRepository();

const SAJILO_STAY_SYSTEM_PROMPT = `You are a helpful assistant for SajiloStay, a property rental platform.

Follow these strict rules:
1. Property Recommendations: Recommend properties using ONLY the property data provided in the database context.
2. Bookings & Favorites: Answer questions regarding user bookings and favorite properties using ONLY the database context provided.
3. Missing Data: If no matching data exists in the context (or if no property matches the query criteria), explicitly state: "No matching property found".
4. Strict Grounding: Never invent, hallucinate, or assume any property, booking, price, or location that is not present in the context.
5. Response Style: Keep all responses concise, direct, and helpful.`;

export class ChatService {
  async processMessage(message: string, userId?: string): Promise<string> {
    console.log("processMessage - userId:", userId);
    console.log("processMessage - message:", message);
    
    if (!message || message.trim() === "") {
      throw new HttpException(400, "Message is required");
    }

    // Detect intent
    const intentResult = intentDetectionService.detectIntent(message);
    console.log("Detected intent:", intentResult);

    let context = "";

    // Route based on intent
    switch (intentResult.intent) {
      case "property":
        context = await this.fetchPropertyContext(intentResult.extractedParams);
        break;
      case "booking":
        if (!userId) {
          throw new HttpException(401, "Authentication required to access bookings");
        }
        context = await this.fetchBookingContext(userId);
        break;
      case "favorite":
        console.log("processMessage - favorite intent detected, userId:", userId);
        if (!userId) {
          throw new HttpException(401, "Authentication required to access favorites");
        }
        context = await this.fetchFavoriteContext(userId);
        break;
      case "general":
        // No context needed for general queries
        break;
    }

    console.log("processMessage - context length:", context.length);
    console.log("processMessage - context content:", context);
    console.log("processMessage - sending to Gemini with context");
    
    // Generate response with context and system prompt
    const reply = await geminiService.generateResponse(
      message,
      context || undefined,
      SAJILO_STAY_SYSTEM_PROMPT
    );
    
    console.log("processMessage - Gemini reply:", reply);

    return reply;
  }

  private async fetchPropertyContext(params?: any): Promise<string> {
    try {
      const { data } = await propertyRepository.getAllPaginated(
        1,
        20,
        params?.keywords,
        params?.category
      );

      if (data.length === 0) {
        return "No properties found matching your criteria.";
      }

      // Filter by extracted parameters
      let filteredProperties = data;

      if (params?.location) {
        filteredProperties = filteredProperties.filter(p =>
          p.location.toLowerCase().includes(params.location.toLowerCase())
        );
      }

      if (params?.minPrice !== undefined) {
        filteredProperties = filteredProperties.filter(p =>
          p.pricePerNight >= params.minPrice
        );
      }

      if (params?.maxPrice !== undefined) {
        filteredProperties = filteredProperties.filter(p =>
          p.pricePerNight <= params.maxPrice
        );
      }

      if (params?.amenities && params.amenities.length > 0) {
        filteredProperties = filteredProperties.filter(p =>
          params.amenities.every((amenity: string) =>
            p.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
          )
        );
      }

      if (filteredProperties.length === 0) {
        return "No properties found matching your criteria.";
      }

      // Format properties as context
      const propertiesContext = filteredProperties.map(p => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        location: p.location,
        pricePerNight: p.pricePerNight,
        category: p.category,
        amenities: p.amenities,
        status: p.status,
      }));

      return JSON.stringify(propertiesContext, null, 2);
    } catch (error) {
      console.error("Error fetching property context:", error);
      return "Error fetching property data.";
    }
  }

  private async fetchBookingContext(userId: string): Promise<string> {
    try {
      const bookings = await bookingRepository.getBookingsByUserId(userId);

      if (bookings.length === 0) {
        return "You have no bookings.";
      }

      const bookingsContext = bookings.map(b => ({
        id: b._id.toString(),
        status: b.status,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalPrice: b.totalPrice,
        property: b.propertyId ? {
          title: (b.propertyId as any).title,
          location: (b.propertyId as any).location,
        } : null,
      }));

      return JSON.stringify(bookingsContext, null, 2);
    } catch (error) {
      console.error("Error fetching booking context:", error);
      return "Error fetching booking data.";
    }
  }

  private async fetchFavoriteContext(userId: string): Promise<string> {
    try {
      console.log("fetchFavoriteContext - userId:", userId);
      console.log("fetchFavoriteContext - userId type:", typeof userId);
      
      const favorites = await favoriteRepository.getFavoritesByUserId(userId);
      console.log("fetchFavoriteContext - favorites count:", favorites.length);
      console.log("fetchFavoriteContext - raw favorites:", JSON.stringify(favorites, null, 2));

      if (favorites.length === 0) {
        console.log("fetchFavoriteContext - No favorites found for user");
        return "You have no favorite properties.";
      }

      // Check if properties are already populated
      const favoritesWithProperties = favorites.map((f) => {
        const propertyData = f.propertyId as any;
        console.log("fetchFavoriteContext - propertyData for favorite:", f._id.toString(), propertyData);
        
        return {
          id: f._id.toString(),
          property: propertyData ? {
            id: propertyData._id?.toString(),
            title: propertyData.title,
            location: propertyData.location,
            pricePerNight: propertyData.pricePerNight,
            category: propertyData.category,
            status: propertyData.status,
          } : null,
        };
      });

      console.log("fetchFavoriteContext - favoritesWithProperties:", JSON.stringify(favoritesWithProperties, null, 2));
      const contextString = JSON.stringify(favoritesWithProperties, null, 2);
      console.log("fetchFavoriteContext - context length:", contextString.length);
      return contextString;
    } catch (error) {
      console.error("Error fetching favorite context:", error);
      console.error("Error stack:", (error as Error).stack);
      return "Error fetching favorite data.";
    }
  }
}
