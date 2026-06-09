import { Request, Response, NextFunction } from "express";
import { SECRET_KEY } from "../configs/constant";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";
import { UserMongoRepository } from "../repositories/user.repository";
import { HttpException } from "../exceptions/http-exception";
import { ApiResponseHelper } from "../utils/apihelper.util";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any> | IUser;
    }
  }
} // adding tag (user) to request, can use req.user
let userRepository = new UserMongoRepository();
export const authorizedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new HttpException(401, "Unauthorized JWT invalid");
    // JWT token should start with "Bearer <token>"
    const token = authHeader.split(" ")[1]; // 0 -> Bearer, 1 -> token
    if (!token) throw new HttpException(401, "Unauthorized JWT missing");
    const decodedToken = jwt.verify(token, SECRET_KEY) as Record<string, any>;
    if (!decodedToken || !decodedToken.id) {
      throw new HttpException(401, "Unauthorized JWT unverified");
    } // make function async
    const user = await userRepository.getUserById(decodedToken.id);
    if (!user) throw new HttpException(401, "Unauthorized user not found");
    req.user = user; // attach user to request (like tag)
    return next();
  } catch (err: Error | any) {
    return ApiResponseHelper.error(
      res,
      err.message || "Internal Server Error",
      err.status || 500,
    );
  }
};

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "Unauthorized no user info");
    }
    if (req.user.role !== "admin") {
      throw new HttpException(403, "Forbidden not admin");
    }
    return next();
  } catch (err: Error | any) {
    return ApiResponseHelper.error(
      res,
      err.message || "Internal Server Error",
      err.status || 500,
    );
  }
};
