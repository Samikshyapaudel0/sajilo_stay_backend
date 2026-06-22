import { UserController } from "../controllers/user.controller";
import { Router } from "express";

import { authorizedMiddleware } from "../middlewares/authorized.middleware";
const userRouter = Router();
const userController = new UserController();

userRouter.post("/register", userController.createUser);
userRouter.post("/login", userController.loginUser);

userRouter.get("/whoami", authorizedMiddleware, userController.whoami);

userRouter.put(
  "/update",
  authorizedMiddleware, // handle authentication and set req.user
  uploads.single("profileImage"), // handle profile image upload
  userController.updateUser,
);

userRouter.get("/profile", authorizedMiddleware, userController.getProfile);
export default userRouter;
