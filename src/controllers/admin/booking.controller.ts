import { z } from "zod";
import { ApiResponseHelper } from "../../utils/apihelper.util";
import { Request, Response } from "express";
import { BookingService } from "../../services/booking.service";

const bookingService = new BookingService();

const UpdateBookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected", "cancelled", "completed"]),
});

interface QueryParams {
  page?: string;
  limit?: string;
}

export class AdminBookingController {
  async getAllBookings(req: Request, res: Response) {
    try {
      const { page, limit }: QueryParams = req.query;
      const { data, pagination } = await bookingService.getAllBookings(
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

  async updateBookingStatus(req: Request, res: Response) {
    try {
      const bookingId = req.params.id as string;
      if (!bookingId) {
        return ApiResponseHelper.error(res, "Booking ID is required", 400);
      }

      const statusData = UpdateBookingStatusSchema.safeParse(req.body);
      if (!statusData.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(statusData.error),
          400,
        );
      }

      const updatedBooking = await bookingService.updateBookingStatusByAdmin(
        bookingId,
        statusData.data.status,
      );
      return ApiResponseHelper.success(
        res,
        updatedBooking,
        "Booking status updated successfully",
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
