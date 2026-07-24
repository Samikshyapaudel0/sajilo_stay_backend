import mongoose, { Schema, Document } from "mongoose";
import { UserType } from "../types/user.type";

export interface IUser extends UserType, Document {
  // can add mongo related attr
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const UserMongoSchema: Schema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user", "host"], default: "user" },
    phoneNumber: { type: String, required: true },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    imageUrl: { type: String, required: false },
  },
  {
    timestamps: true, // createdAt and updatedAt will be automatically added and managed by mongoose
  },
);
export const UserModel = mongoose.model<IUser>(
  "User", // db.users -> Model Name "User"
  UserMongoSchema,
);
