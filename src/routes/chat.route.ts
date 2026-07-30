import { ChatController } from "../controllers/chat.controller";
import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const chatRouter = Router();
const chatController = new ChatController();

// Simple test route
chatRouter.get("/test", (req, res) => {
  console.log("===== TEST ROUTE HIT =====");
  res.json({ message: "Chat route is working" });
});

// Simple POST test route
chatRouter.post("/test", (req, res) => {
  console.log("===== POST TEST ROUTE HIT =====");
  console.log("Body:", req.body);
  res.json({ message: "POST chat route is working", received: req.body });
});

// Chat endpoint - authentication is optional
// Property queries work without auth, booking/favorite queries require auth
chatRouter.post("/chat", (req, res, next) => {
  console.log("===== CHAT ROUTE HIT =====");
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Path:", req.path);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  next();
}, chatController.chat);

export default chatRouter;
