export type IntentType = "property" | "booking" | "favorite" | "general";

export interface IntentDetectionResult {
  intent: IntentType;
  confidence: number;
  extractedParams?: {
    location?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    keywords?: string;
  };
}

export class IntentDetectionService {
  detectIntent(message: string): IntentDetectionResult {
    const lowerMessage = message.toLowerCase();

    // Property-related keywords
    const propertyKeywords = [
      "property", "properties", "rent", "rental", "stay", "accommodation",
      "room", "apartment", "house", "hotel", "guest house", "place to stay",
      "available", "book a place", "find a place", "looking for", "search"
    ];

    // Booking-related keywords
    const bookingKeywords = [
      "booking", "bookings", "reservation", "reservations", "my booking",
      "my reservation", "upcoming", "past booking", "cancel booking"
    ];

    // Favorite-related keywords
    const favoriteKeywords = [
      "favorite", "favorites", "saved", "wishlist", "my favorite",
      "my saved", "my wishlist", "liked"
    ];

    // Check for property intent
    if (propertyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: "property",
        confidence: 0.9,
        extractedParams: this.extractPropertyParams(lowerMessage),
      };
    }

    // Check for booking intent
    if (bookingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: "booking",
        confidence: 0.9,
      };
    }

    // Check for favorite intent
    if (favoriteKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: "favorite",
        confidence: 0.9,
      };
    }

    // Default to general
    return {
      intent: "general",
      confidence: 0.5,
    };
  }

  private extractPropertyParams(message: string): any {
    const params: any = {};

    // Extract location
    const locationPatterns = [
      /(?:in|at|near|around)\s+([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+)\s+(?:area|place|location)/i,
    ];
    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        params.location = match[1].trim();
        break;
      }
    }

    // Extract category
    const categories = ["apartment", "house", "hotel", "guest house", "room", "villa"];
    for (const category of categories) {
      if (message.includes(category)) {
        params.category = category;
        break;
      }
    }

    // Extract price range
    const priceMatch = message.match(/under\s+(\d+)/i);
    if (priceMatch) {
      params.maxPrice = parseInt(priceMatch[1]);
    }

    const priceRangeMatch = message.match(/between\s+(\d+)\s+and\s+(\d+)/i);
    if (priceRangeMatch) {
      params.minPrice = parseInt(priceRangeMatch[1]);
      params.maxPrice = parseInt(priceRangeMatch[2]);
    }

    // Extract amenities
    const amenitiesList = ["wifi", "parking", "pool", "gym", "ac", "air conditioning", "kitchen", "tv"];
    const foundAmenities = amenitiesList.filter(amenity => message.includes(amenity));
    if (foundAmenities.length > 0) {
      params.amenities = foundAmenities;
    }

    // Extract keywords for general search
    const words = message.split(/\s+/).filter(word => word.length > 3);
    if (words.length > 0) {
      params.keywords = words.join(" ");
    }

    return params;
  }
}
