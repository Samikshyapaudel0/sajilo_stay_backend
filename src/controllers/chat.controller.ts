import { ChatService } from "../services/chat.service";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { Request, Response } from "express";
import { z } from "zod";

console.log("===== CHAT CONTROLLER LOADED =====");

const chatService = new ChatService();

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export class ChatController {
  async chat(req: Request, res: Response) {
    console.log("===== CHAT METHOD CALLED =====");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    try {
      const parsedData = ChatRequestSchema.safeParse(req.body);
      if (!parsedData.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(parsedData.error),
          400,
        );
      }

      // Get userId from authenticated request (optional for property queries, required for bookings/favorites)
      const userId = (req as any).user?._id;
      console.log("ChatController - userId:", userId);
      console.log("ChatController - full user object:", (req as any).user);

      const reply = await chatService.processMessage(parsedData.data.message, userId);
      
      return ApiResponseHelper.success(
        res,
        { reply },
        "Chat response generated successfully",
      );
    } catch (error: Error | any | unknown) {
      return ApiResponseHelper.error(
        res,
        error.message || "Internal Server Error",
        error.status || 500,
      );
    }
  }
}
