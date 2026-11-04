// Регистрация webhook в Telegram.
// Запуск (Node 24): node --env-file=.env scripts/set-webhook.mjs
// Требует: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL (https://...)

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!token || !appUrl) {
  console.error("Нужны TELEGRAM_BOT_TOKEN и NEXT_PUBLIC_APP_URL в окружении");
  process.exit(1);
}
if (!appUrl.startsWith("https://")) {
  console.error("NEXT_PUBLIC_APP_URL должен быть https:// (Telegram не примет http)");
  process.exit(1);
}

const url = `${appUrl.replace(/\/$/, "")}/api/bot`;
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret || undefined,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  }),
});

const data = await res.json();
console.log("setWebhook →", JSON.stringify(data));
process.exit(data.ok ? 0 : 1);
