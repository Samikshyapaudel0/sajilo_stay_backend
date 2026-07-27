import { PaymentMongoRepository } from "../repositories/payment.repository";
import { BookingMongoRepository } from "../repositories/booking.repository";
import { InitiatePaymentDTO, VerifyPaymentDTO } from "../dtos/payment.dto";
import { IPayment, PaymentStatus } from "../models/payment.model";
import { IBooking, BookingStatus } from "../models/booking.model";
import { HttpException } from "../exceptions/http-exception";
import { createHash } from "crypto";

const paymentRepository = new PaymentMongoRepository();
const bookingRepository = new BookingMongoRepository();

interface EsewaVerifyResponse {
  transaction_id: string;
  status: string;
  total_amount: number;
}

export class PaymentService {
  private readonly esewaMerchantCode: string;
  private readonly esewaSecretKey: string;
  private readonly esewaEnvironment: string;
  private readonly esewaApiUrl: string;

  constructor() {
    this.esewaMerchantCode = process.env.ESEWA_MERCHANT_CODE || "";
    this.esewaSecretKey = process.env.ESEWA_SECRET_KEY || "";
    this.esewaEnvironment = process.env.ESEWA_ENVIRONMENT || "TEST";
    
    if (this.esewaEnvironment === "TEST") {
      this.esewaApiUrl = "https://uat.esewa.com.np";
    } else {
      this.esewaApiUrl = "https://esewa.com.np";
    }
    
    if (!this.esewaMerchantCode || !this.esewaSecretKey) {
      console.warn("ESEWA_MERCHANT_CODE or ESEWA_SECRET_KEY not set in environment variables");
    }
  }

  private generateSignature(totalAmount: number, transactionUuid: string, productCode: string): string {
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return createHash("sha256")
      .update(signatureString + this.esewaSecretKey)
      .digest("hex");
  }

  private verifySignature(
    totalAmount: number,
    transactionUuid: string,
    productCode: string,
    receivedSignature: string,
  ): boolean {
    const expectedSignature = this.generateSignature(totalAmount, transactionUuid, productCode);
    return expectedSignature === receivedSignature;
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

    // Generate transaction UUID (using purchase_order_id)
    const transactionUuid = paymentData.purchase_order_id;
    const productCode = this.esewaMerchantCode;
    const totalAmount = paymentData.amount;

    // Generate signature
    const signature = this.generateSignature(totalAmount, transactionUuid, productCode);

    // Create payment record
    const payment = await paymentRepository.createPayment({
      bookingId: booking._id,
      userId: userId as any,
      amount: paymentData.amount,
      status: "pending",
      pidx: transactionUuid,
      esewaProductId: productCode,
      esewaSignature: signature,
    });

    // Construct eSewa payment URL
    const paymentUrl = `${this.esewaApiUrl}/epay/main`;
    const paymentUrlWithParams = `${paymentUrl}?scd=${productCode}&amt=${totalAmount}&pid=${transactionUuid}&su=${paymentData.return_url}&fu=${paymentData.website_url}`;

    console.log("========== ESEWA PAYMENT INITIATION ==========");
    console.log("Payment URL:", paymentUrlWithParams);
    console.log("Transaction UUID:", transactionUuid);
    console.log("Product Code:", productCode);
    console.log("Amount:", totalAmount);
    console.log("Signature:", signature);
    console.log("==============================================");

    return {
      paymentUrl: paymentUrlWithParams,
      pidx: transactionUuid,
      payment,
    };
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
      // Verify payment with eSewa API
      const transactionUuid = paymentData.pidx;
      const productCode = payment.esewaProductId || this.esewaMerchantCode;
      const totalAmount = payment.amount;

      const verifyUrl = `${this.esewaApiUrl}/epay/transrec`;
      const verifyParams = new URLSearchParams({
        amt: totalAmount.toString(),
        pid: transactionUuid,
        scd: productCode,
      });

      console.log("========== ESEWA PAYMENT VERIFICATION ==========");
      console.log("Verify URL:", verifyUrl);
      console.log("Transaction UUID:", transactionUuid);
      console.log("Product Code:", productCode);
      console.log("Amount:", totalAmount);
      console.log("=================================================");

      const esewaResponse = await fetch(`${verifyUrl}?${verifyParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseText = await esewaResponse.text();
      console.log("eSewa Response:", responseText);

      // eSewa returns response in format: "transaction_id,amount,status"
      const responseParts = responseText.split(",");
      if (responseParts.length < 3) {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(500, "Invalid response from eSewa");
      }

      const esewaTransactionId = responseParts[0].trim();
      const esewaAmount = parseFloat(responseParts[1].trim());
      const esewaStatus = responseParts[2].trim();

      if (esewaStatus !== "Completed" && esewaStatus !== "COMPLETE") {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(400, "Payment not completed");
      }

      if (Math.abs(esewaAmount - payment.amount) > 1) {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(400, "Payment amount mismatch");
      }

      const updatedPayment = await paymentRepository.update(payment._id.toString(), {
        status: "completed" as PaymentStatus,
        esewaTransactionId: esewaTransactionId,
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
      console.error("eSewa verify payment error:", error);
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
