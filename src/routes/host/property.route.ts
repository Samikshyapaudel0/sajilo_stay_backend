import { Router } from "express";
import {
  authorizedMiddleware,
  hostMiddleware,
} from "../../middlewares/authorized.middleware";
import { HostPropertyController } from "../../controllers/host/property.controller";
import { uploads } from "../../middlewares/upload.middlewares";

const router = Router();
const hostPropertyController = new HostPropertyController();

router.use(authorizedMiddleware, hostMiddleware);

// api endpoints for host property management
router.post("/", uploads.array("images", 10), hostPropertyController.createProperty);
router.get("/", hostPropertyController.getProperties);
router.get("/:id", hostPropertyController.getPropertyById);
router.put(
  "/:id",
  uploads.array("images", 10),
  hostPropertyController.updateProperty,
);
router.delete("/:id", hostPropertyController.deleteProperty);

router.post(
  "/",
  (req, res, next) => {
    console.log("POST /host/properties route reached");
    next();
  },
  uploads.array("images", 10),
  hostPropertyController.createProperty,
);

export default router;
