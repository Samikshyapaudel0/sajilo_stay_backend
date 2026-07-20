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
    console.log("Content-Type:", req.get('Content-Type'));
    next();
  },
  (req, res, next) => {
    console.log("Before multer middleware");
    next();
  },
  uploads.array("images", 10),
  (req, res, next) => {
    console.log("After multer middleware");
    console.log("Files:", req.files);
    console.log("Body:", req.body);
    next();
  },
  hostPropertyController.createProperty,
);

export default router;
