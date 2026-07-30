import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();
const paymentController = new PaymentController();

// Public endpoints — eSewa redirects to these after payment.
// Must be registered BEFORE authorizedMiddleware.
router.get("/esewa/callback", paymentController.esewaCallback);
router.get("/esewa/failure", paymentController.esewaFailure);

router.use(authorizedMiddleware);

router.post("/initiate", paymentController.initiatePayment);
router.post("/verify", paymentController.verifyPayment);
router.get("/", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);

export default router;
