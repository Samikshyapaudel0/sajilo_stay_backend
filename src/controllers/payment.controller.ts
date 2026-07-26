import { z } from "zod";
import { InitiatePaymentDTO, VerifyPaymentDTO } from "../dtos/payment.dto";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";

const paymentService = new PaymentService();

export class PaymentController {
  async initiatePayment(req: Request, res: Response) {
    try {
      console.log("========== INITIATE PAYMENT REQUEST ==========");
      console.log("req.body:", req.body);
      console.log("req.user:", req.user);
      console.log("==============================================");

      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const paymentData = InitiatePaymentDTO.safeParse(req.body);
      if (!paymentData.success) {
        console.log("Validation error:", paymentData.error);
        return ApiResponseHelper.error(
          res,
          z.prettifyError(paymentData.error),
          400,
        );
      }

      const result = await paymentService.initiatePayment(
        paymentData.data,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        {
          paymentUrl: result.paymentUrl,
          pidx: result.pidx,
          payment: result.payment,
        },
        "Payment initiated successfully",
        201,
      );
    } catch (error: Error | any | unknown) {
      console.error("========== INITIATE PAYMENT ERROR ==========");
      console.error(error);
      console.error(error.stack);
      console.error("=============================================");
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async verifyPayment(req: Request, res: Response) {
    try {
      console.log("========== VERIFY PAYMENT REQUEST ==========");
      console.log("req.body:", req.body);
      console.log("req.user:", req.user);
      console.log("===========================================");

      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const paymentData = VerifyPaymentDTO.safeParse(req.body);
      if (!paymentData.success) {
        console.log("Validation error:", paymentData.error);
        return ApiResponseHelper.error(
          res,
          z.prettifyError(paymentData.error),
          400,
        );
      }

      const result = await paymentService.verifyPayment(
        paymentData.data,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        {
          payment: result.payment,
          booking: result.booking,
        },
        "Payment verified successfully",
        200,
      );
    } catch (error: Error | any | unknown) {
      console.error("========== VERIFY PAYMENT ERROR ==========");
      console.error(error);
      console.error(error.stack);
      console.error("========================================");
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const paymentId = req.params.id as string;
      if (!paymentId) {
        return ApiResponseHelper.error(res, "Payment ID is required", 400);
      }

      const payment = await paymentService.getPaymentById(
        paymentId,
        userId.toString(),
      );

      return ApiResponseHelper.success(
        res,
        payment,
        "Payment retrieved successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }

  async getPayments(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return ApiResponseHelper.error(res, "User ID not found", 401);
      }

      const payments = await paymentService.getPaymentsByUser(userId.toString());

      return ApiResponseHelper.success(
        res,
        payments,
        "Payments retrieved successfully",
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
