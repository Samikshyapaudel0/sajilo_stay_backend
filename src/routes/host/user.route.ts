import { Router } from "express";
import {
  authorizedMiddleware,
  hostMiddleware,
} from "../../middlewares/authorized.middleware";
import { HostUserController } from "../../controllers/host/user.controller";
import { uploads } from "../../middlewares/upload.middlewares";

const router = Router();
const hostUserController = new HostUserController();

router.use(authorizedMiddleware, hostMiddleware);

// host dashboard endpoint
router.get("/", hostUserController.dashboard);

// api endpoints for host user management
router.get("/users", hostUserController.getAllUserPaginated);
router.get("/users/:id", hostUserController.getUserById);
router.post("/users", hostUserController.createUser);
router.put(
  "/users/:id",
  uploads.single("profileImage"),
  hostUserController.updateUser,
);
router.put("/users/:id/password", hostUserController.updatePassword);
router.delete("/users/:id", hostUserController.deleteUser);

export default router;
