import { UserController } from "../controllers/user.controller";
import { Router } from "express";

import { authorizedMiddleware } from "../middlewares/authorized.middleware";
const userRouter = Router();
const userController = new UserController();

userRouter.post("/register", userController.createUser);
userRouter.post("/login", userController.loginUser);

userRouter.get("/profile", authorizedMiddleware, userController.getProfile);
export default userRouter;
