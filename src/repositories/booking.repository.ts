import { BookingModel, IBooking } from "../models/booking.model";

export interface IBookingRepository {
  createBooking(booking: Partial<IBooking>): Promise<IBooking>;
  getBookingById(id: string): Promise<IBooking | null>;
  getBookingsByUserId(userId: string): Promise<IBooking[]>;
  getBookingsByHostId(hostId: string): Promise<IBooking[]>;
  update(id: string, booking: Partial<IBooking>): Promise<IBooking | null>;
  getBookingsByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: IBooking[]; total: number }>;
}

export class BookingMongoRepository implements IBookingRepository {
  async createBooking(booking: Partial<IBooking>): Promise<IBooking> {
    const created = await BookingModel.create(booking);
    return created;
  }

  async getBookingById(id: string): Promise<IBooking | null> {
    const found = await BookingModel.findById(id).populate(
      "propertyId",
      "title location images",
    );
    return found;
  }

  async getBookingsByUserId(userId: string): Promise<IBooking[]> {
    const found = await BookingModel.find({ userId })
      .populate("propertyId", "title location images")
      .sort({ createdAt: -1 });
    return found;
  }

  async getBookingsByHostId(hostId: string): Promise<IBooking[]> {
    const found = await BookingModel.find({ hostId })
      .populate("propertyId", "title location images")
      .populate("userId", "firstName lastName email username")
      .sort({ createdAt: -1 });
    return found;
  }

  async update(id: string, booking: Partial<IBooking>): Promise<IBooking | null> {
    const updated = await BookingModel.findByIdAndUpdate(id, booking, {
      new: true,
    }).populate("propertyId", "title location images");
    return updated;
  }

  async getBookingsByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: IBooking[]; total: number }> {
    const query = { userId };
    const total = await BookingModel.countDocuments(query);
    const data = await BookingModel.find(query)
      .populate("propertyId", "title location images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return { data, total };
  }
}
