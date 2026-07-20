import { Router } from "express";
import {
  authorizedMiddleware,
  hostMiddleware,
} from "../../middlewares/authorized.middleware";
import { HostBookingController } from "../../controllers/host/booking.controller";

const router = Router();
const hostBookingController = new HostBookingController();

router.use(authorizedMiddleware, hostMiddleware);

router.get("/", hostBookingController.getBookings);
router.put("/:id/confirm", hostBookingController.confirmBooking);
router.put("/:id/reject", hostBookingController.rejectBooking);

export default router;
