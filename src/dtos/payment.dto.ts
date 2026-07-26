import { z } from "zod";

export const InitiatePaymentDTO = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  return_url: z.string().url("Return URL must be a valid URL"),
  website_url: z.string().url("Website URL must be a valid URL"),
  purchase_order_id: z.string().min(1, "Purchase order ID is required"),
  purchase_order_name: z.string().min(1, "Purchase order name is required"),
});

export const VerifyPaymentDTO = z.object({
  pidx: z.string().min(1, "Pidx is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  transaction_id: z.string().optional(),
});

export type InitiatePaymentDTO = z.infer<typeof InitiatePaymentDTO>;
export type VerifyPaymentDTO = z.infer<typeof VerifyPaymentDTO>;
