import { bot } from "../../../src/lib/bot/bot";

export async function POST(req: Request) {
  try {
    // Verify secret token if configured
    if (process.env.WEBHOOK_SECRET) {
      const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secret !== process.env.WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Parse the update from Telegram
    const update = await req.json();
    console.log("Webhook received update:", JSON.stringify(update, null, 2));

    // Process the update with the bot
    if (!bot.isInited()) {
      await bot.init();
    }
    await bot.handleUpdate(update);
    console.log("Bot handled update successfully");

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
