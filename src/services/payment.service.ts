import { PaymentMongoRepository } from "../repositories/payment.repository";
import { BookingMongoRepository } from "../repositories/booking.repository";
import { InitiatePaymentDTO, VerifyPaymentDTO } from "../dtos/payment.dto";
import { IPayment, PaymentStatus } from "../models/payment.model";
import { IBooking, BookingStatus } from "../models/booking.model";
import { HttpException } from "../exceptions/http-exception";
import { createHmac } from "crypto";

const paymentRepository = new PaymentMongoRepository();
const bookingRepository = new BookingMongoRepository();

interface EsewaStatusResponse {
  status: string;
  transaction_code?: string;
  ref_id?: string;
  total_amount?: string | number;
}

export class PaymentService {
  private readonly esewaMerchantCode: string;
  private readonly esewaSecretKey: string;
  private readonly esewaEnvironment: string;
  private readonly esewaApiUrl: string;
  private readonly esewaStatusUrl: string;

  private readonly esewaSuccessUrl: string;
  private readonly esewaFailureUrl: string;

  constructor() {
    this.esewaMerchantCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
    this.esewaSecretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    this.esewaEnvironment = process.env.ESEWA_ENVIRONMENT || "TEST";

    if (this.esewaEnvironment === "TEST") {
      this.esewaApiUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
      this.esewaStatusUrl = "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
    } else {
      this.esewaApiUrl = "https://epay.esewa.com.np/api/epay/main/v2/form";
      this.esewaStatusUrl = "https://epay.esewa.com.np/api/epay/transaction/status/";
    }

    // eSewa only accepts http/https URLs — never a custom URI scheme.
    // These must be valid HTTPS endpoints reachable by eSewa's servers.
    this.esewaSuccessUrl =
      process.env.ESEWA_SUCCESS_URL ||
      "https://sajilo-backend.onrender.com/api/v1/payments/esewa/callback";
    this.esewaFailureUrl =
      process.env.ESEWA_FAILURE_URL ||
      "https://sajilo-backend.onrender.com/api/v1/payments/esewa/failure";

    if (!this.esewaMerchantCode || !this.esewaSecretKey) {
      console.warn("ESEWA_MERCHANT_CODE or ESEWA_SECRET_KEY not set in environment variables");
    }
  }

  private generateSignature(totalAmount: string, transactionUuid: string, productCode: string): string {
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return createHmac("sha256", this.esewaSecretKey)
      .update(signatureString)
      .digest("base64");
  }

  private verifySignature(
    totalAmount: string,
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
  ): Promise<{
    payment_url: string;
    paymentUrl: string;
    formData: any;
    pidx: string;
    payment: IPayment;
    formAction: string;
  }> {
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

    // Mock payment mode for testing
    if (process.env.MOCK_PAYMENT === "true") {
      console.log("========== MOCK PAYMENT MODE ==========");
      console.log("Skipping eSewa API and creating mock payment");
      
      // Generate a fresh unique transaction UUID on every call
      const randomSuffix = Math.random().toString(16).slice(2, 6);
      const transactionUuid = `${paymentData.bookingId}-${Date.now()}-${randomSuffix}`;
      const totalAmount = paymentData.amount;

      // Create completed payment record
      const payment = await paymentRepository.createPayment({
        bookingId: booking._id,
        userId: userId as any,
        amount: totalAmount,
        status: "completed",
        pidx: transactionUuid,
        esewaProductId: this.esewaMerchantCode,
        esewaSignature: "mock_signature",
        esewaTransactionId: "mock_transaction_" + transactionUuid,
      });

      // Update booking status to confirmed
      const updatedBooking = await bookingRepository.update(payment.bookingId.toString(), {
        status: "confirmed" as BookingStatus,
      });

      console.log("Mock payment created successfully");
      console.log("======================================");

      return {
        payment_url: "http://localhost:3000/mock-payment",
        paymentUrl: "http://localhost:3000/mock-payment",
        formData: { mock: true },
        pidx: transactionUuid,
        payment,
        formAction: "",
      };
    }

    // Generate a fresh unique transaction UUID on every call.
    // eSewa rejects duplicate transaction_uuid values, so we must never
    // reuse an old one (e.g. the same bookingId across retries).
    // Format: <bookingId>-<timestamp>-<4-char random hex>
    const randomSuffix = Math.random().toString(16).slice(2, 6);
    const transactionUuid = `${paymentData.bookingId}-${Date.now()}-${randomSuffix}`;
    const productCode = this.esewaMerchantCode;
    const amount = paymentData.amount;
    const taxAmount = 0;
    const productServiceCharge = 0;
    const productDeliveryCharge = 0;
    const totalAmount = amount + taxAmount + productServiceCharge + productDeliveryCharge;

    // Convert to string representation for amount
    const amountStr = amount.toString();
    const taxAmountStr = taxAmount.toString();
    const totalAmountStr = totalAmount.toString();
    const productServiceChargeStr = productServiceCharge.toString();
    const productDeliveryChargeStr = productDeliveryCharge.toString();

    // Generate signature using exact string values that will be sent in form
    const signature = this.generateSignature(totalAmountStr, transactionUuid, productCode);

    // Log signature generation details
    const signatureString = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    console.log("========== ESEWA SIGNATURE GENERATION ==========");
    console.log("Secret Key:", this.esewaSecretKey);
    console.log("Signature String:", signatureString);
    console.log("Generated Signature:", signature);
    console.log("================================================");

    // Create payment record
    const payment = await paymentRepository.createPayment({
      bookingId: booking._id,
      userId: userId as any,
      amount: totalAmount,
      status: "pending",
      pidx: transactionUuid,
      esewaProductId: productCode,
      esewaSignature: signature,
    });

    // Construct form data for eSewa ePay v2
    const formData = {
      amount: amountStr,
      tax_amount: taxAmountStr,
      total_amount: totalAmountStr,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: productServiceChargeStr,
      product_delivery_charge: productDeliveryChargeStr,
      // eSewa only accepts http/https URLs. Use the backend HTTPS callback
      // endpoints configured via ESEWA_SUCCESS_URL / ESEWA_FAILURE_URL env vars.
      // The client-supplied return_url (e.g. a custom URI scheme) is intentionally
      // ignored here.
      success_url: this.esewaSuccessUrl,
      failure_url: this.esewaFailureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    // Obtain direct eSewa checkout payment URL
    let paymentUrl = "";
    try {
      const params = new URLSearchParams(formData);
      const esewaRes = await fetch(this.esewaApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        redirect: "manual",
      });

      const redirectLocation = esewaRes.headers.get("location");
      if (redirectLocation) {
        paymentUrl = redirectLocation;
      } else {
        paymentUrl = `${this.esewaApiUrl}?${params.toString()}`;
      }
    } catch (err) {
      console.error("Error fetching eSewa redirect URL:", err);
      const params = new URLSearchParams(formData);
      paymentUrl = `${this.esewaApiUrl}?${params.toString()}`;
    }

    console.log("========== ESEWA FORM DATA ==========");
    console.log("Form Action:", this.esewaApiUrl);
    console.log("Payment URL:", paymentUrl);
    console.log("amount:", formData.amount);
    console.log("total_amount:", formData.total_amount);
    console.log("transaction_uuid:", formData.transaction_uuid);
    console.log("product_code:", formData.product_code);
    console.log("signature:", formData.signature);
    console.log("======================================");

    return {
      payment_url: paymentUrl,
      paymentUrl: paymentUrl,
      formData,
      pidx: transactionUuid,
      payment,
      formAction: this.esewaApiUrl,
    };
  }

  async verifyPayment(
    paymentData: VerifyPaymentDTO,
    userId: string,
  ): Promise<{ payment: IPayment; booking: IBooking }> {
    let pidx = paymentData.pidx;

    // Decode base64 data parameter if provided (from eSewa redirect)
    if (!pidx && paymentData.data) {
      try {
        const decoded = JSON.parse(Buffer.from(paymentData.data, "base64").toString("utf-8"));
        if (decoded && decoded.transaction_uuid) {
          pidx = decoded.transaction_uuid;
        }
      } catch (err) {
        console.error("Failed to parse base64 data parameter:", err);
      }
    }

    if (!pidx) {
      throw new HttpException(400, "Transaction UUID (pidx) is required for verification");
    }

    const payment = await paymentRepository.getPaymentByPidx(pidx);
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
      const transactionUuid = pidx;
      const productCode = payment.esewaProductId || this.esewaMerchantCode;

      // eSewa Status API uses GET request
      const statusQueryUrl = `${this.esewaStatusUrl}?product_code=${encodeURIComponent(productCode)}&total_amount=${payment.amount}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;

      console.log("========== ESEWA PAYMENT VERIFICATION ==========");
      console.log("Status Query URL:", statusQueryUrl);
      console.log("Transaction UUID:", transactionUuid);
      console.log("Product Code:", productCode);
      console.log("=================================================");

      const esewaResponse = await fetch(statusQueryUrl, {
        method: "GET",
      });

      if (!esewaResponse.ok) {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(500, "Failed to connect to eSewa status API");
      }

      const responseText = await esewaResponse.text();
      console.log("eSewa Status Response:", responseText);

      let statusData: EsewaStatusResponse;
      try {
        statusData = JSON.parse(responseText);
      } catch (e) {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(500, "Invalid response from eSewa status API");
      }

      if (statusData.status !== "COMPLETE") {
        await paymentRepository.update(payment._id.toString(), {
          status: "failed" as PaymentStatus,
        });
        throw new HttpException(400, `Payment not completed. Status: ${statusData.status}`);
      }

      if (statusData.total_amount !== undefined && statusData.total_amount !== null) {
        const esewaTotalAmount = typeof statusData.total_amount === "number" 
          ? statusData.total_amount 
          : parseFloat(statusData.total_amount);
        if (Math.abs(esewaTotalAmount - payment.amount) > 1) {
          await paymentRepository.update(payment._id.toString(), {
            status: "failed" as PaymentStatus,
          });
          throw new HttpException(400, "Payment amount mismatch");
        }
      }

      const esewaTxnId = statusData.ref_id || statusData.transaction_code || transactionUuid;

      const updatedPayment = await paymentRepository.update(payment._id.toString(), {
        status: "completed" as PaymentStatus,
        esewaTransactionId: esewaTxnId,
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
