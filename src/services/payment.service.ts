import { PaymentMongoRepository } from "../repositories/payment.repository";
import { BookingMongoRepository } from "../repositories/booking.repository";
import { InitiatePaymentDTO, VerifyPaymentDTO } from "../dtos/payment.dto";
import { IPayment, PaymentStatus } from "../models/payment.model";
import { IBooking, BookingStatus } from "../models/booking.model";
import { HttpException } from "../exceptions/http-exception";

const paymentRepository = new PaymentMongoRepository();
const bookingRepository = new BookingMongoRepository();

interface KhaltiInitiateResponse {
  payment_url: string;
  pidx: string;
  total_amount: number;
  status: string;
}

interface KhaltiVerifyResponse {
  pidx: string;
  transaction_id: string;
  amount: number;
  total_amount: number;
  status: string;
}

export class PaymentService {
  private readonly khaltiSecretKey: string;
  private readonly khaltiApiUrl: string;

  constructor() {
    this.khaltiSecretKey = process.env.KHALTI_SECRET_KEY || "";
    this.khaltiApiUrl = process.env.KHALTI_API_URL || "https://a.khalti.com/api/v2";
    
    if (!this.khaltiSecretKey) {
      console.warn("KHALTI_SECRET_KEY not set in environment variables");
    }
  }

  async initiatePayment(
    paymentData: InitiatePaymentDTO,
    userId: string,
  ): Promise<{ paymentUrl: string; pidx: string; payment: IPayment }> {
    const booking = await bookingRepository.getBookingById(paymentData.bookingId);
    if (!booking) {
      throw new HttpException(404, "Booking not found");
    }

    if (booking.userId.toString() !== userId.toString()) {
      throw new HttpException(403, "Forbidden - Booking does not belong to this user");
    }

    if (booking.status !== "pending") {
      console.log("Booking status:", booking.status);
      console.log("Booking:", booking);
      throw new HttpException(400, "Only pending bookings can be paid");
    }

    if (paymentData.amount !== booking.totalPrice) {
      throw new HttpException(400, "Payment amount does not match booking total price");
    }

    const existingPayment = await paymentRepository.getPaymentByBookingId(paymentData.bookingId);
    if (existingPayment && existingPayment.status === "completed") {
      throw new HttpException(400, "Payment already completed for this booking");
    }

    const khaltiPayload = {
      return_url: paymentData.return_url,
      website_url: paymentData.website_url,
      amount: paymentData.amount * 100, // Khalti expects amount in paisa
      purchase_order_id: paymentData.purchase_order_id,
      purchase_order_name: paymentData.purchase_order_name,
      customer_info: {
        name: "Customer",
        email: "customer@example.com",
        phone: "9800000000",
      },
    };

    try {
      const khaltiResponse = await fetch(`${this.khaltiApiUrl}/epayment/initiate/`, {
        method: "POST",
        headers: {
          "Authorization": `Key ${this.khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(khaltiPayload),
      });

      const khaltiData: KhaltiInitiateResponse = await khaltiResponse.json();
      console.log("========== KHALTI RESPONSE ==========");
      console.log("Status:", khaltiResponse.status);
      console.log("Response:", khaltiData);
      console.log("=====================================");
      // if (!khaltiResponse.ok || !khaltiData.payment_url) {
      //   throw new HttpException(500, "Failed to initiate Khalti payment");
      // }
      if (!khaltiResponse.ok) {
        throw new HttpException(
          khaltiResponse.status,
          JSON.stringify(khaltiData),
        );
      }

      const payment = await paymentRepository.createPayment({
        bookingId: booking._id,
        userId: userId as any,
        amount: paymentData.amount,
        status: "pending",
        pidx: khaltiData.pidx,
      });

      return {
        paymentUrl: khaltiData.payment_url,
        pidx: khaltiData.pidx,
        payment,
      };
    } catch (error: Error | any) {
      console.log("========== KHALTI ERROR ==========");
      console.log("Status:", error.response?.status);
      console.log("Data:", error.response?.data);
      console.log("Message:", error.message);
      console.log("==================================");
      //console.error("Khalti initiate payment error:", error);
      throw new HttpException(500, "Failed to initiate payment with Khalti");
    }
  }

  async verifyPayment(
    paymentData: VerifyPaymentDTO,
    userId: string,
  ): Promise<{ payment: IPayment; booking: IBooking }> {
    const payment = await paymentRepository.updateByPidx(paymentData.pidx, {});
    if (!payment) {
      throw new HttpException(404, "Payment not found");
    }

    if (payment.userId.toString() !== userId.toString()) {
      throw new HttpException(403, "Forbidden - Payment does not belong to this user");
    }

    if (payment.status === "completed") {
      const booking = await bookingRepository.getBookingById(payment.bookingId.toString());
      if (!booking) {
        throw new HttpException(404, "Booking not found");
      }
      return { payment, booking };
    }

    try {
      const khaltiResponse = await fetch(`${this.khaltiApiUrl}/epayment/lookup/`, {
        method: "POST",
        headers: {
          "Authorization": `Key ${this.khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pidx: paymentData.pidx }),
      });

      const khaltiData: KhaltiVerifyResponse = await khaltiResponse.json();

      if (!khaltiResponse.ok) {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(500, "Failed to verify payment with Khalti");
      }

      if (khaltiData.status !== "Completed") {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(400, "Payment not completed");
      }

      const amountInRupees = khaltiData.total_amount / 100;
      if (Math.abs(amountInRupees - payment.amount) > 1) {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(400, "Payment amount mismatch");
      }

      const updatedPayment = await paymentRepository.update(payment._id.toString(), {
        status: "completed" as PaymentStatus,
        khaltiTransactionId: khaltiData.transaction_id,
      });

      if (!updatedPayment) {
        throw new HttpException(500, "Failed to update payment status");
      }

      const booking = await bookingRepository.update(payment.bookingId.toString(), {
        status: "confirmed" as BookingStatus,
      });

      if (!booking) {
        throw new HttpException(500, "Failed to update booking status");
      }

      return { payment: updatedPayment, booking };
    } catch (error: Error | any) {
      console.error("Khalti verify payment error:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      await paymentRepository.update(payment._id.toString(), {
        status: "failed" as PaymentStatus,
      });
      throw new HttpException(500, "Failed to verify payment");
    }
  }

  async getPaymentById(id: string, userId: string): Promise<IPayment> {
    const payment = await paymentRepository.getPaymentById(id);
    if (!payment) {
      throw new HttpException(404, "Payment not found");
    }

    if (payment.userId.toString() !== userId.toString()) {
      throw new HttpException(403, "Forbidden - Payment does not belong to this user");
    }

    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<IPayment[]> {
    const payments = await paymentRepository.getPaymentsByUserId(userId);
    return payments;
  }
}
