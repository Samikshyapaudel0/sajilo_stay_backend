import mongoose, { Schema, Document } from "mongoose";

export interface IProperty extends Document {
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  category: string;
  amenities: string[];
  images: string[];
  status: "available" | "booked";
  hostId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyMongoSchema: Schema = new Schema<IProperty>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    category: { type: String, required: true },
    amenities: { type: [String], required: true, default: [] },
    images: { type: [String], required: true, default: [] },
    status: { type: String, enum: ["available", "booked"], default: "available" },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  },
);

export const PropertyModel = mongoose.model<IProperty>(
  "Property",
  PropertyMongoSchema,
);
