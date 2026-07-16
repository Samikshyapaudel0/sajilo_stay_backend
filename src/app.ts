import express, { Application, NextFunction, Request, Response } from "express";

import { HttpException } from "./exceptions/http-exception";
import { ApiResponseHelper } from "./utils/apihelper.util";
import cors from "cors";
import morgan from "morgan";

// routes
import userRoutes from "./routes/user.route";
import adminUserRoutes from "./routes/admin/user.route";
import hostUserRoutes from "./routes/host/user.route";
import adminPropertyRoutes from "./routes/admin/property.route";
import hostPropertyRoutes from "./routes/host/property.route";
import propertyRoutes from "./routes/property.route";
import path from "path";

const app: Application = express();
const corsOptions = {
  origin: ["*"], // ["http://localhost:3000", "http://example.com"]
  successStatus: 200,
};
app.use(cors(corsOptions)); // enable CORS for all routes

app.use(express.json()); // json input
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded
app.use(morgan("combined")); // log all requests

app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // serve static files from uploads folder

app.use("/api/v1/auth", userRoutes); // user related routes

// public routes
app.use("/api/v1/properties", propertyRoutes); // public property browsing routes

// admin routes
app.use("/api/v1/admin/users", adminUserRoutes); // admin user related routes
app.use("/api/v1/admin/properties", adminPropertyRoutes); // admin property related routes

// host routes
app.use("/api/v1/host", hostUserRoutes); // host user related routes
app.use("/api/v1/host/properties", hostPropertyRoutes); // host property related routes


// global api handler (at the last)
app.use((req: Request, res: Response) => {
  return res.status(404).json({ message: "API not found" });
});
// global error handler (at the last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  if (err instanceof HttpException) {
    return ApiResponseHelper.error(res, err.message, err.status);
  }
  return ApiResponseHelper.error(res, "Internal Server Error", 500);
});

export default app;
