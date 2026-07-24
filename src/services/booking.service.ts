import { BookingMongoRepository } from "../repositories/booking.repository";
import { PropertyMongoRepository } from "../repositories/property.repository";
import { CreateBookingDTO } from "../dtos/booking.dto";
import { IBooking, BookingStatus } from "../models/booking.model";
import { HttpException } from "../exceptions/http-exception";

const bookingRepository = new BookingMongoRepository();
const propertyRepository = new PropertyMongoRepository();

function calculateNights(checkInDate: Date, checkOutDate: Date): number {
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return nights;
}

function formatBookingResponse(booking: IBooking) {
  const bookingObj = booking.toObject();
  const property = bookingObj.propertyId as any;

  return {
    ...bookingObj,
    propertyId: property?._id || bookingObj.propertyId,
    property: property
      ? {
          _id: property._id,
          title: property.title,
          location: property.location,
          imageUrl: property.images?.[0] || null,
        }
      : null,
  };
}

export class BookingService {
  async createBooking(
    bookingData: CreateBookingDTO,
    userId: string,
  ): Promise<IBooking> {
    const property = await propertyRepository.getPropertyById(
      bookingData.propertyId,
    );
    if (!property) {
      throw new HttpException(404, "Property not found");
    }

    const nights = calculateNights(
      bookingData.checkInDate,
      bookingData.checkOutDate,
    );
    if (nights < 1) {
      throw new HttpException(400, "Booking must be at least 1 night");
    }

    const totalPrice = property.pricePerNight * nights;

    const booking = await bookingRepository.createBooking({
      userId: userId as any,
      propertyId: bookingData.propertyId as any,
      hostId: property.hostId,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      guests: bookingData.guests,
      totalPrice,
      status: "pending",
    });

    const populatedBooking = await bookingRepository.getBookingById(
      booking._id.toString(),
    );
    if (!populatedBooking) {
      throw new HttpException(500, "Failed to create booking");
    }
    return formatBookingResponse(populatedBooking) as any;
  }

  async getBookingsByUser(userId: string, page?: string, limit?: string) {
    const currentPage = page && parseInt(page) > 0 ? parseInt(page) : 1;
    const currentLimit = limit && parseInt(limit) > 0 ? parseInt(limit) : 10;

    const { data, total } = await bookingRepository.getBookingsByUserIdPaginated(
      userId,
      currentPage,
      currentLimit,
    );

    const formattedData = data.map(formatBookingResponse);
    const pagination = {
      page: currentPage,
      limit: currentLimit,
      total,
    };

    return { data: formattedData, pagination };
  }

  async getBookingById(id: string, userId: string) {
    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
      throw new HttpException(404, "Booking not found");
    }

    if (booking.userId.toString() !== userId.toString()) {
      throw new HttpException(403, "Forbidden - Booking does not belong to this user");
    }

    return formatBookingResponse(booking);
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
      throw new HttpException(404, "Booking not found");
    }

    if (booking.userId.toString() !== userId.toString()) {
      throw new HttpException(403, "Forbidden - Booking does not belong to this user");
    }

    if (booking.status !== "pending") {
      throw new HttpException(400, "Only pending bookings can be cancelled");
    }

    const updatedBooking = await bookingRepository.update(id, {
      status: "cancelled" as BookingStatus,
    });
    if (!updatedBooking) {
      throw new HttpException(500, "Failed to cancel booking");
    }

    return formatBookingResponse(updatedBooking);
  }

  async getBookingsByHost(hostId: string) {
    const bookings = await bookingRepository.getBookingsByHostId(hostId);
    return bookings.map(formatBookingResponse);
  }

  async confirmBooking(id: string, hostId: string) {
    return this.updateBookingStatusByHost(id, hostId, "confirmed", "pending");
  }

  async rejectBooking(id: string, hostId: string) {
    return this.updateBookingStatusByHost(id, hostId, "rejected", "pending");
  }

  private async updateBookingStatusByHost(
    id: string,
    hostId: string,
    newStatus: BookingStatus,
    requiredStatus: BookingStatus,
  ) {
    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
      throw new HttpException(404, "Booking not found");
    }

    if (booking.hostId.toString() !== hostId.toString()) {
      throw new HttpException(403, "Forbidden - Booking does not belong to this host");
    }

    if (booking.status !== requiredStatus) {
      throw new HttpException(
        400,
        `Only ${requiredStatus} bookings can be ${newStatus}`,
      );
    }

    const updatedBooking = await bookingRepository.update(id, {
      status: newStatus,
    });
    if (!updatedBooking) {
      throw new HttpException(500, `Failed to ${newStatus} booking`);
    }

    return formatBookingResponse(updatedBooking);
  }
}
