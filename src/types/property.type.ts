import { z } from "zod";

export const PropertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  // pricePerNight: z.number().min(0, "Price per night must be a positive number"),
  pricePerNight: z.coerce
    .number()
    .min(0, "Price per night must be a positive number"),
  category: z.string().min(1, "Category is required"),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  status: z.enum(["available", "booked"]).default("available"),
  hostId: z.string(),
});

export type PropertyType = z.infer<typeof PropertySchema>;
