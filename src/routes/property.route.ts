import { Router } from "express";
import { PropertyController } from "../controllers/property.controller";

const router = Router();
const propertyController = new PropertyController();

// public api endpoints for browsing available properties
router.get("/", propertyController.getProperties);
router.get("/:id", propertyController.getPropertyById);

export default router;
