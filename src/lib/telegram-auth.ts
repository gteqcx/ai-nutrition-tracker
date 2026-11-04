import crypto from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

const MAX_AGE_SECONDS = 24 * 60 * 60; // initData считаем валидным сутки

// Проверка подписи Telegram WebApp initData (HMAC-SHA256).
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function verifyInitData(
  initData: string,
  botToken: string,
): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  // В data_check_string входят ВСЕ поля кроме hash (signature остаётся!).
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computed = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Сравнение в постоянном времени.
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  try {
    return JSON.parse(userRaw) as TelegramUser;
  } catch {
    return null;
  }
}

// Достаёт verified telegram_id из заголовка запроса. null = не авторизован.
export function getUserIdFromRequest(req: Request): bigint | null {
  const initData = req.headers.get("x-telegram-init-data");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!initData || !token) return null;
  const user = verifyInitData(initData, token);
  return user ? BigInt(user.id) : null;
}
