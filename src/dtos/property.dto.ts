import { z } from "zod";
import { PropertySchema } from "../types/property.type";

export const CreatePropertyDTO = PropertySchema.pick({
  title: true,
  description: true,
  location: true,
  pricePerNight: true,
  category: true,
  amenities: true,
  images: true,
  status: true,
});

export type CreatePropertyDTO = z.infer<typeof CreatePropertyDTO>;

export const UpdatePropertyDTO = PropertySchema.partial();
export type UpdatePropertyDTO = z.infer<typeof UpdatePropertyDTO>;
