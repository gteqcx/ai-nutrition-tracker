import { webhookCallback } from "grammy";
import { getBot, ensureInit } from "@/lib/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let handler: ((req: Request) => Promise<Response>) | null = null;

export async function POST(req: Request): Promise<Response> {
  const bot = getBot();
  await ensureInit();
  if (!handler) {
    handler = webhookCallback(bot, "std/http", {
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    });
  }
  return handler(req);
}
