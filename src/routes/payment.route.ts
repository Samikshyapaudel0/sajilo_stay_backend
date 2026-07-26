import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();
const paymentController = new PaymentController();

router.use(authorizedMiddleware);

router.post("/initiate", paymentController.initiatePayment);
router.post("/verify", paymentController.verifyPayment);
router.get("/", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);

export default router;
