import { Router } from "express";
import {
  authorizedMiddleware,
  adminMiddleware,
} from "../../middlewares/authorized.middleware";
import { AdminBookingController } from "../../controllers/admin/booking.controller";

const router = Router();
const adminBookingController = new AdminBookingController();

router.use(authorizedMiddleware, adminMiddleware);

// api endpoints for admin booking management
router.get("/", adminBookingController.getAllBookings);
router.put("/:id/status", adminBookingController.updateBookingStatus);

export default router;
