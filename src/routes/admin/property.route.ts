import { Router } from "express";
import {
  authorizedMiddleware,
  adminMiddleware,
} from "../../middlewares/authorized.middleware";
import { AdminPropertyController } from "../../controllers/admin/property.controller";

const router = Router();
const adminPropertyController = new AdminPropertyController();

router.use(authorizedMiddleware, adminMiddleware);

// api endpoints for admin property management
router.get("/", adminPropertyController.getAllProperties);
router.get("/:id", adminPropertyController.getPropertyById);
router.put("/:id/status", adminPropertyController.updatePropertyStatus);
router.delete("/:id", adminPropertyController.deleteProperty);

export default router;
