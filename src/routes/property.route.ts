import { Router } from "express";
import { PropertyController } from "../controllers/property.controller";

const router = Router();
const propertyController = new PropertyController();

// public api endpoints for property browsing
router.get("/", propertyController.getAvailableProperties);
router.get("/:id", propertyController.getAvailablePropertyById);

export default router;
