import mongoose, { Document, Schema } from "mongoose";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: PaymentStatus;
  khaltiTransactionId?: string;
  khaltiToken?: string;
  khaltiIdx?: string;
  pidx?: string;
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMongoSchema: Schema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    khaltiTransactionId: { type: String },
    khaltiToken: { type: String },
    khaltiIdx: { type: String },
    pidx: { type: String },
  },
  { timestamps: true },
);

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentMongoSchema);
