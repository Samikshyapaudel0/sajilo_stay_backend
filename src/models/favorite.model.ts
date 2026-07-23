import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteMongoSchema: Schema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  },
  { timestamps: true },
);

// Create a compound index to ensure a user can only favorite a property once
FavoriteMongoSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<IFavorite>("Favorite", FavoriteMongoSchema);
