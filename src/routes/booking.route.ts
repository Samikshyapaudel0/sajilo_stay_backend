import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { BookingController } from "../controllers/booking.controller";

const router = Router();
const bookingController = new BookingController();

router.use(authorizedMiddleware);

router.post("/", bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.get("/:id", bookingController.getBookingById);
router.put("/:id/cancel", bookingController.cancelBooking);

export default router;
