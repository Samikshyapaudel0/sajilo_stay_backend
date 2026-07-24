import { ApiResponseHelper } from "../../utils/apihelper.util";
import { Request, Response } from "express";
import { BookingService } from "../../services/booking.service";

const bookingService = new BookingService();

export class HostBookingController {
  async getBookings(req: Request, res: Response) {
    try {
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const bookings = await bookingService.getBookingsByHost(hostId.toString());

      return ApiResponseHelper.success(
        res,
        bookings,
        "Bookings retrieved successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async confirmBooking(req: Request, res: Response) {
    try {
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const bookingId = req.params.id as string;
      if (!bookingId) {
        return ApiResponseHelper.error(res, "Booking ID is required", 400);
      }

      const booking = await bookingService.confirmBooking(
        bookingId,
        hostId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        booking,
        "Booking confirmed successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async rejectBooking(req: Request, res: Response) {
    try {
      const hostId = req.user?._id;
      if (!hostId) {
        return ApiResponseHelper.error(res, "Host ID not found", 401);
      }

      const bookingId = req.params.id as string;
      if (!bookingId) {
        return ApiResponseHelper.error(res, "Booking ID is required", 400);
      }

      const booking = await bookingService.rejectBooking(
        bookingId,
        hostId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        booking,
        "Booking rejected successfully",
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
