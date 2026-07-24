import { z } from "zod";
import { BookingSchema } from "../types/booking.type";

export const CreateBookingDTO = BookingSchema.pick({
  propertyId: true,
  checkInDate: true,
  checkOutDate: true,
  guests: true,
}).refine((data) => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be after check-in date",
  path: ["checkOutDate"],
});

export type CreateBookingDTO = z.infer<typeof CreateBookingDTO>;
