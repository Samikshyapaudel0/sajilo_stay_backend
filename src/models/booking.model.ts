import mongoose, { Document, Schema } from "mongoose";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingMongoSchema: Schema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const BookingModel = mongoose.model<IBooking>("Booking", BookingMongoSchema);
