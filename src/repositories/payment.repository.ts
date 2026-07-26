import { PaymentModel, IPayment } from "../models/payment.model";

export interface IPaymentRepository {
  createPayment(payment: Partial<IPayment>): Promise<IPayment>;
  getPaymentById(id: string): Promise<IPayment | null>;
  getPaymentByBookingId(bookingId: string): Promise<IPayment | null>;
  getPaymentsByUserId(userId: string): Promise<IPayment[]>;
  update(id: string, payment: Partial<IPayment>): Promise<IPayment | null>;
  updateByPidx(pidx: string, payment: Partial<IPayment>): Promise<IPayment | null>;
}

export class PaymentMongoRepository implements IPaymentRepository {
  async createPayment(payment: Partial<IPayment>): Promise<IPayment> {
    const created = await PaymentModel.create(payment);
    return created;
  }

  async getPaymentById(id: string): Promise<IPayment | null> {
    const found = await PaymentModel.findById(id).populate(
      "bookingId",
      "checkInDate checkOutDate totalPrice status",
    ).populate("userId", "firstName lastName email");
    return found;
  }

  async getPaymentByBookingId(bookingId: string): Promise<IPayment | null> {
    const found = await PaymentModel.findOne({ bookingId }).populate(
      "bookingId",
      "checkInDate checkOutDate totalPrice status",
    ).populate("userId", "firstName lastName email");
    return found;
  }

  async getPaymentsByUserId(userId: string): Promise<IPayment[]> {
    const found = await PaymentModel.find({ userId })
      .populate("bookingId", "checkInDate checkOutDate totalPrice status")
      .sort({ createdAt: -1 });
    return found;
  }

  async update(id: string, payment: Partial<IPayment>): Promise<IPayment | null> {
    const updated = await PaymentModel.findByIdAndUpdate(id, payment, {
      new: true,
    }).populate("bookingId", "checkInDate checkOutDate totalPrice status");
    return updated;
  }

  async updateByPidx(pidx: string, payment: Partial<IPayment>): Promise<IPayment | null> {
    const updated = await PaymentModel.findOneAndUpdate({ pidx }, payment, {
      new: true,
    }).populate("bookingId", "checkInDate checkOutDate totalPrice status");
    return updated;
  }
}
