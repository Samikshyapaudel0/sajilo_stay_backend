import { z } from "zod";
import { CreateBookingDTO } from "../dtos/booking.dto";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { Request, Response } from "express";
import { BookingService } from "../services/booking.service";

const bookingService = new BookingService();

interface QueryParams {
  page?: string;
  limit?: string;
}

export class BookingController {
  async createBooking(req: Request, res: Response) {
    try {
      console.log("========== BOOKING REQUEST ==========");
      console.log("req.body:", req.body);
      console.log("req.user:", req.user);
      console.log("======================================");

      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const bookingData = CreateBookingDTO.safeParse(req.body);
      if (!bookingData.success) {
        console.log("Validation error:", bookingData.error);
        return ApiResponseHelper.error(
          res,
          z.prettifyError(bookingData.error),
          400,
        );
      }

      const booking = await bookingService.createBooking(
        bookingData.data,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        booking,
        "Booking request created successfully",
        201,
      );
    } catch (error: Error | any | unknown) {
       console.error("========== BOOKING ERROR ==========");
       console.error(error);
       console.error(error.stack);
       console.error("====================================");
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getBookings(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const { page, limit }: QueryParams = req.query;
      const { data, pagination } = await bookingService.getBookingsByUser(
        userId.toString(),
        page,
        limit,
      );

      return ApiResponseHelper.success(
        res,
        data,
        "Bookings retrieved successfully",
        200,
        pagination,
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getBookingById(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const bookingId = req.params.id as string;
      if (!bookingId) {
        return ApiResponseHelper.error(res, "Booking ID is required", 400);
      }

      const booking = await bookingService.getBookingById(
        bookingId,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        booking,
        "Booking retrieved successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async cancelBooking(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const bookingId = req.params.id as string;
      if (!bookingId) {
        return ApiResponseHelper.error(res, "Booking ID is required", 400);
      }

      const booking = await bookingService.cancelBooking(
        bookingId,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        booking,
        "Booking cancelled successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }
}
