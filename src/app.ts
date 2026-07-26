// import express, { Application, NextFunction, Request, Response } from "express";

// import { HttpException } from "./exceptions/http-exception";
// import { ApiResponseHelper } from "./utils/apihelper.util";
// import cors from "cors";
// import morgan from "morgan";

// // routes
// import userRoutes from "./routes/user.route";
// import adminUserRoutes from "./routes/admin/user.route";
// import hostUserRoutes from "./routes/host/user.route";
// import adminPropertyRoutes from "./routes/admin/property.route";
// import hostPropertyRoutes from "./routes/host/property.route";
// import propertyRoutes from "./routes/property.route";
// import bookingRoutes from "./routes/booking.route";
// import hostBookingRoutes from "./routes/host/booking.route";
// import path from "path";
// const app: Application = express();
// const corsOptions = {
//   origin: ["*"], // ["http://localhost:3000", "http://example.com"]
//   successStatus: 200,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };
// app.use(cors(corsOptions)); // enable CORS for all routes

// app.use(express.json({ type: 'application/json' })); // json input (only for application/json)
// app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded
// app.use(morgan("combined")); // log all requests

// app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // serve static files from uploads folder

// app.use("/api/v1/auth", userRoutes); // user related routes
// app.use("/api/v1/properties", propertyRoutes); // public property related routes

// // admin routes
// app.use("/api/v1/admin/users", adminUserRoutes); // admin user related routes
// app.use("/api/v1/admin/properties", adminPropertyRoutes); // admin property related routes

// // host routes
// app.use("/api/v1/host", hostUserRoutes); // host user related routes
// app.use("/api/v1/host/properties", hostPropertyRoutes); // host property related routes
// app.use("/api/v1/bookings", bookingRoutes); // user booking related routes
// app.use("/api/v1/host/bookings", hostBookingRoutes); // host booking related routes

// // global api handler (at the last)
// app.use((req: Request, res: Response) => {
//   return res.status(404).json({ message: "API not found" });
// });
// // global error handler (at the last)
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error("Error:", err);
//   if (err instanceof HttpException) {
//     return ApiResponseHelper.error(res, err.message, err.status);
//   }
//   return ApiResponseHelper.error(res, "Internal Server Error", 500);
// });

// export default app;


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
import bookingRoutes from "./routes/booking.route";
import hostBookingRoutes from "./routes/host/booking.route";
import favoriteRoutes from "./routes/favorite.route";
import paymentRoutes from "./routes/payment.route";
import path from "path";
const app: Application = express();
const corsOptions = {
  origin: "http://localhost:3000", 
  successStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

// app.use(express.json()); // json input
app.use((req, res, next) => {
  console.log("Incoming Content-Type:", req.headers["content-type"]);
  next();
});

app.use(express.json());

app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded
app.use(morgan("combined")); // log all requests

app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // serve static files from uploads folder

app.use("/api/v1/auth", userRoutes); // user related routes
app.use("/api/v1/properties", propertyRoutes); // public property related routes

// admin routes
app.use("/api/v1/admin/users", adminUserRoutes); // admin user related routes
app.use("/api/v1/admin/properties", adminPropertyRoutes); // admin property related routes

// host routes
app.use("/api/v1/host", hostUserRoutes); // host user related routes
app.use("/api/v1/host/properties", hostPropertyRoutes); // host property related routes
app.use("/api/v1/bookings", bookingRoutes); // user booking related routes
app.use("/api/v1/host/bookings", hostBookingRoutes); // host booking related routes
app.use("/api/v1/favorites", favoriteRoutes); // user favorite related routes
app.use("/api/v1/payments", paymentRoutes); // user payment related routes

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
