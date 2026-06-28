import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/user.controller";
import {
  authorizedMiddleware,
  adminMiddleware,
} from "../../middlewares/authorized.middleware";
import { uploads } from "../../middlewares/upload.middleware";

const router = Router();
const adminUserController = new AdminUserController();

router.use(authorizedMiddleware, adminMiddleware);

// api endpoints for admin user management
router.get("/", adminUserController.getAllUserPaginated);
router.get("/:id", adminUserController.getUserById);
router.post("/", adminUserController.createUser);
router.put(
  "/:id",
  uploads.single("profileImage"),
  adminUserController.updateUser,
); // multipart for image upload
router.put("/:id/password", adminUserController.updatePassword);
router.delete("/:id", adminUserController.deleteUser);

export default router;
