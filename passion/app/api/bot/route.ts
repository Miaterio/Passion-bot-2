import { bot } from "../../../src/lib/bot/bot";
import { webhookCallback } from "grammy";

// Optional: Add secret token validation if needed, but grammy's webhookCallback handles the update parsing.
// To verify X-Telegram-Bot-Api-Secret-Token, we might need a custom handler wrapper, 
// but for now we'll trust the path is secret enough or add a check if strictly required.
// The plan mentioned verifying it.

/*
export async function POST(req: Request) {
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  return webhookCallback(bot, "next-js")(req);
}
*/
// Actually, let's implement the security check as planned.

const handleUpdate = webhookCallback(bot, "next-js");

export async function POST(req: Request) {
  if (process.env.WEBHOOK_SECRET) {
    const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== process.env.WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  return handleUpdate(req);
}
