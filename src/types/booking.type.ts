import { z } from "zod";

export const BookingSchema = z.object({
  userId: z.string(),
  propertyId: z.string().min(1, "Property ID is required"),
  hostId: z.string(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  guests: z.coerce.number().int().min(1, "At least 1 guest is required"),
  totalPrice: z.coerce.number().min(0),
  status: z
    .enum(["pending", "confirmed", "rejected", "cancelled", "completed"])
    .default("pending"),
});

export type BookingType = z.infer<typeof BookingSchema>;
